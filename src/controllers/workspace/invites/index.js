const {
  WorkspaceInvite,
  WorkspaceMember,
  User,
  Workspace,
  sequelize,
} = require("../../../database/models");
const { getAuth } = require("@clerk/express");
const {
  sendWorkspaceInviteEmail,
} = require("../../../services/workspaceInviteEmail");
const { Op } = require("sequelize");
const {
  getWorkspaceNameAndSlug,
} = require("../../../services/workspace.services");
const {
  findWorkspaceInvite,
  isInviteActive,
  generateInviteMeta,
  updateExpiredInvite,
  createWorkspaceInvite,
  deleteWorkspaceInviteByIdToken,
  getInvitations,
  normalizeEmail,
  INVITE_EXPIRY_DAYS,
} = require("../../../services/workspace.invites.services");
const { getUserName } = require("../../../services/auth/user.service");
const { getUserRole } = require("../../authorization/controller");
const { rolePermissions } = require("../../../constants/rolePermission");

const ALLOWED_INVITE_ROLES = ["admin", "member", "viewer"];

const hasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission) || permissions.includes("*");
};

/**
 * Create invite
 * Body:
 *  - workspaceId
 *  - email
 *  - role (admin/member/viewer)
 */
const createInvite = async (req, res) => {
  const transaction = await sequelize.transaction(); // start transaction
  try {
    const { workspaceId, email, role } = req.body;
    const { userId } = getAuth(req);

    if (!workspaceId || !email) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "workspaceId and email are required",
      });
    }

    if (role && !ALLOWED_INVITE_ROLES.includes(role)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `role must be one of: ${ALLOWED_INVITE_ROLES.join(", ")}`,
      });
    }

    // 1️⃣ Check existing invite
    const existingInvite = await findWorkspaceInvite(
      workspaceId,
      email,
      transaction,
    );

    // 2️⃣ Block if active invite exists
    if (isInviteActive(existingInvite)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: "An active invite already exists for this email",
      });
    }

    // 3️⃣ Generate token + expiry
    const { token, expiresAt } = generateInviteMeta();

    let invite;

    // 4️⃣ Update expired invite
    if (existingInvite) {
      invite = await updateExpiredInvite({
        invite: existingInvite,
        token,
        expiresAt,
        role: role || existingInvite.role,
        createdBy: userId,
        transaction,
      });
    }
    // 5️⃣ Create new invite
    else {
      invite = await createWorkspaceInvite({
        workspaceId,
        email,
        role: role || "member",
        token,
        expiresAt,
        createdBy: userId,
        transaction, // pass transaction
      });
    }

    // ✅ Resolve human-readable values
    const [workspace, inviterName] = await Promise.all([
      getWorkspaceNameAndSlug(workspaceId),
      getUserName(userId),
    ]);

    const inviteLink = `${process.env.ORIGIN}/accept-invitation/${token}?workspaceName=${encodeURIComponent(
      workspace.workspaceName,
    )}&invitedBy=${encodeURIComponent(inviterName)}&role=${encodeURIComponent(
      invite.role,
    )}&workspaceSlug=${encodeURIComponent(workspace.workspaceSlug)}`;

    await transaction.commit();
    // ✅ Send email (outside DB transaction, we don't want rollback if email fails)
    await sendWorkspaceInviteEmail({
      to: email,
      inviteLink,
      role: invite.role,
      workspaceName: workspace.workspaceName,
      createdBy: inviterName,
      expiresInDays: INVITE_EXPIRY_DAYS,
    }).catch((err) => {
      console.error("Email send failed:", err?.message ?? err);
    });

    return res.json({ success: true, invite });
  } catch (err) {
    await transaction.rollback(); // rollback any DB changes
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "An active invite already exists for this email",
      });
    }
    console.error("Invite error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong creating the invite",
    });
  }
};

/**
 * Accept invite
 * Body:
 *  - token
 */
const acceptInvite = async (req, res) => {
  const transaction = await sequelize.transaction(); // start transaction
  try {
    const { token } = req.body;
    if (!token) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "token is required" });
    }

    const { userId } = getAuth(req);
    const currentUser = req.user; // set by attachUserAndWorkspaceId — has .email

    const invite = await WorkspaceInvite.findOne({ where: { token }, transaction });
    if (!invite) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Invite not found" });
    }

    if (invite.acceptedAt) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ success: false, message: "This invite has already been accepted" });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Invite expired" });
    }

    // An emailed invite may only be accepted by that email's account — the
    // token travels in a URL and is forwardable, so without this a stray
    // link could be used to join a workspace under the wrong identity.
    if (
      invite.email &&
      normalizeEmail(invite.email) !== normalizeEmail(currentUser.email)
    ) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: `This invite was sent to ${invite.email}. Sign in with that email to accept it.`,
      });
    }

    // Check if user already a member
    const existing = await WorkspaceMember.findOne({
      where: { workspaceId: invite.workspaceId, userId },
      transaction,
    });

    let member = existing;
    if (!existing) {
      member = await WorkspaceMember.create(
        {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
          status: true,
        },
        { transaction },
      );
    }

    // Mark invite accepted either way — a re-click of an already-joined
    // invite should resolve cleanly instead of erroring.
    invite.acceptedAt = new Date();
    await invite.save({ transaction });

    const workspace = await Workspace.findByPk(invite.workspaceId, { transaction });

    await transaction.commit();
    return res.json({
      success: true,
      alreadyMember: Boolean(existing),
      member,
      workspaceSlug: workspace?.workspaceSlug,
    });
  } catch (err) {
    await transaction.rollback();
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ success: false, message: "Already a member of this workspace" });
    }
    console.error("Accept invite error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong accepting the invite" });
  }
};

/**
 * Add existing user instantly (bypass invite) — admin action, gated by
 * requirePermission("invite:manage") in the router.
 * Query params:
 *  - workspaceId
 *  - userId
 *  - role
 */
const addExistingUser = async (req, res) => {
  try {
    const { workspaceId, userId, role } = req.query;

    if (role && !["owner", "admin", "member", "viewer"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // Check if already member
    const existing = await WorkspaceMember.findOne({
      where: { workspaceId, userId },
    });
    if (existing)
      return res.status(400).json({ message: "User already a member" });

    const member = await WorkspaceMember.create({
      workspaceId,
      userId,
      role: role || "member",
      status: true,
    });

    res.json({ success: true, member });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "User already a member" });
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/**
 * List pending invites — admin action, gated by requirePermission("invite:manage").
 * Query params:
 *  - workspaceId
 */
const getWorkspaceInvites = async (req, res) => {
  try {
    const { workspaceId } = req.query;

    const invites = await WorkspaceInvite.findAll({
      where: {
        workspaceId,
        acceptedAt: { [Op.is]: null },
      },
      attributes: ["id", "email", "role", "createdAt", "token"],
      include: [
        {
          model: User,
          attributes: ["username"],
        },
        {
          model: Workspace,
          attributes: ["workspaceName"],
        },
      ],
    });

    res.json({ success: true, invites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// list a user's own pending invites, by their account email
const getUserWorkspaceInvitesByEmail = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email } = req.query;

    if (!email)
      return res
        .status(422)
        .json({ success: false, message: "email is missing" });

    const userInvitations = await getInvitations({
      email,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      success: true,
      invitations: userInvitations,
    });
  } catch (error) {
    await transaction.rollback(); // rollback any DB changes
    console.error("Invite error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong fetching invitations",
    });
  }
};

// Delete/decline an invite. Dual-purpose: either the invitee is declining
// their own invite (email must match), or a workspace admin is revoking a
// pending invite they sent (checked via role permission on that workspace).
const deleteInvite = async (req, res) => {
  try {
    const { id, token } = req.query;

    if (!id && !token) {
      return res.status(400).json({
        success: false,
        message: "ID or Token is required",
      });
    }

    const where = {};
    if (id) where.id = id;
    if (token) where.token = token;

    const invite = await WorkspaceInvite.findOne({ where });
    if (!invite) {
      return res.status(404).json({ success: false, message: "Invite not found" });
    }

    const { userId } = getAuth(req);
    const currentUser = req.user;

    const isInvitee =
      invite.email && normalizeEmail(invite.email) === normalizeEmail(currentUser.email);

    if (!isInvitee) {
      const role = await getUserRole(userId, invite.workspaceId);
      if (!role || !hasPermission(role, "invite:manage")) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    const deletedInvitationId = await deleteWorkspaceInviteByIdToken(
      invite.id,
      undefined,
    );

    return res.json({
      success: true,
      message: "Invite deleted successfully",
      invitationId: deletedInvitationId,
    });
  } catch (err) {
    console.error("Delete invite error:", err);
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};
module.exports = {
  getWorkspaceInvites,
  getUserWorkspaceInvitesByEmail,
  createInvite,
  acceptInvite,
  addExistingUser,
  deleteInvite,
};
