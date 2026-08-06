const crypto = require("crypto");
const { WorkspaceInvite, User, Workspace } = require("../database/models");

const INVITE_EXPIRY_DAYS = 7;

const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : email);

const getInvitations = async ({ email, transaction }) => {
  return WorkspaceInvite.findAll({
    where: { email: normalizeEmail(email), acceptedAt: null },
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
    transaction,
  });
};
/**
 * Find existing invite for workspace + email
 */
const findWorkspaceInvite = async (workspaceId, email, transaction) => {
  return WorkspaceInvite.findOne({
    where: { workspaceId, email: normalizeEmail(email), acceptedAt: null },
    transaction,
  });
};

/**
 * Check if invite is still active. A null expiresAt is a shareable link
 * that never expires, so it counts as active too.
 */
const isInviteActive = (invite) => {
  if (!invite) return false;
  if (!invite.expiresAt) return true;
  return invite.expiresAt > new Date();
};

/**
 * Generate invite token + expiry
 */
const generateInviteMeta = () => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  return { token, expiresAt };
};

/**
 * Update expired invite
 */
const updateExpiredInvite = async ({
  invite,
  token,
  expiresAt,
  role,
  createdBy,
  transaction,
}) => {
  return invite.update(
    {
      token,
      expiresAt,
      role,
      createdBy,
    },
    {
      transaction,
    },
  );
};

/**
 * Create new invite
 */
const createWorkspaceInvite = async ({
  workspaceId,
  email,
  role,
  token,
  expiresAt,
  createdBy,
  transaction,
}) => {
  return WorkspaceInvite.create(
    {
      workspaceId,
      email: normalizeEmail(email),
      role,
      token,
      expiresAt,
      createdBy,
    },
    { transaction },
  );
};

/**
 * Delete invite by ID Or Token
 */
const deleteWorkspaceInviteByIdToken = async (id, token) => {
  if (!id && !token) {
    throw new Error("inviteId or token is required");
  }

  const where = {};

  if (id) {
    where.id = id;
  }

  if (token) {
    where.token = token;
  }

  const invite = await WorkspaceInvite.findOne({ where });

  if (!invite) {
    throw new Error("Invite not found");
  }

  await invite.destroy();

  return invite.id;
};

module.exports = {
  INVITE_EXPIRY_DAYS,
  normalizeEmail,
  getInvitations,
  findWorkspaceInvite,
  isInviteActive,
  generateInviteMeta,
  updateExpiredInvite,
  createWorkspaceInvite,
  deleteWorkspaceInviteByIdToken,
};
