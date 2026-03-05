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
  INVITE_EXPIRY_DAYS,
} = require("../../../services/workspace.invites.services");
const { getUserName } = require("../../../services/auth/user.service");

/**
 * Create invite
 * Query params:
 *  - workspaceId
 *  - email (optional)
 *  - role (member/admin)
 */
const createInvite = async (req, res) => {
  const transaction = await sequelize.transaction(); // start transaction
  try {
    const { workspaceId, email, role } = req.body;
    const { userId } = getAuth(req);

    if (!workspaceId || !email) {
      return res.status(400).json({
        success: false,
        message: "workspaceId and email are required",
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
        transaction: transaction, // pass transaction
      });
    }

    // ✅ Resolve human-readable values
    const [workspace, inviterName] = await Promise.all([
      getWorkspaceNameAndSlug(workspaceId),
      getUserName(userId),
    ]);

    const inviteLink = `${process.env.ORIGIN}/accept-invitation/${token}?workspaceName=${workspace.workspaceName}&invitedBy=${inviterName}&role=${invite.role}&workspaceSlug=${workspace.workspaceSlug}`;

    // ✅ Send email (outside DB transaction, we don't want rollback if email fails)
    await sendWorkspaceInviteEmail({
      to: email,
      inviteLink,
      role: invite.role,
      workspaceName: workspace.workspaceName,
      createdBy: inviterName,
      expiresInDays: INVITE_EXPIRY_DAYS,
    });

    await transaction.commit(); // commit transaction after DB changes are safe

    return res.json({ success: true, invite });
  } catch (err) {
    await t.rollback(); // rollback any DB changes
    console.error("Invite error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Accept invite
 * Query params:
 *  - token
 */
const acceptInvite = async (req, res) => {
  const transaction = await sequelize.transaction(); // start transaction
  try {
    const { token } = req.body;
    const { userId } = getAuth(req);

    const invite = await WorkspaceInvite.findOne({ where: { token } });
    if (!invite) return res.status(404).json({ message: "Invite not found" });

    if (invite.expiresAt && invite.expiresAt < new Date())
      return res.status(400).json({ message: "Invite expired" });

    // Check if user already a member
    const existing = await WorkspaceMember.findOne({
      where: {
        workspaceId: invite.workspaceId,
        userId,
      },
    });
    if (existing) return res.status(400).json({ message: "Already a member" });

    // Add user as member
    const member = await WorkspaceMember.create({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      status: true,
    });

    // Mark invite accepted
    invite.acceptedAt = new Date();
    await invite.save();

    await transaction.commit();
    res.json({ success: true, member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Add existing user instantly (bypass invite)
 * Query params:
 *  - workspaceId
 *  - userId
 *  - role
 */
const addExistingUser = async (req, res) => {
  try {
    const { workspaceId, userId, role } = req.query;

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
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * List pending invites
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
    res.status(500).json({ success: false, message: err.message });
  }
};

// send workspace invitation to a specific user
const getUserWorkspaceInvitesByEmail = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { email } = req.query;

    // check if clerk id exists
    if (!email)
      return res
        .status(422)
        .json({ success: false, message: "email is missing" });

    // find invitations using user clerk id
    const userInvitations = await getInvitations({
      email,
      transaction,
    });

    await transaction.commit();
    // send invitations in response
    return res.status(200).json({
      success: true,
      invitations: userInvitations,
    });
  } catch (error) {
    await transaction.rollback(); // rollback any DB changes
    console.error("Invite error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const deleteInvite = async (req, res) => {
  try {
    const { id, token } = req.query;

    if (!id && !token) {
      return res.status(400).json({
        success: false,
        message: "ID or Token is required",
      });
    }

    // delete invite by id OR token
    const deletedInvitationId = await deleteWorkspaceInviteByIdToken(id, token);

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
