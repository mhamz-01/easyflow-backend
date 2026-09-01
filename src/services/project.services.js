const { Op } = require("sequelize");
const { Project, PrivateProjectMember } = require("../database/models");
const { ADMIN_ROLES } = require("./auth/workspaceMember");

// workspaceRole is optional — pass it when the caller already resolved it
// (e.g. via requirePermission, which stashes it on req.workspaceRole) to
// avoid a second lookup. Workspace admins/owners see every project in their
// workspace regardless of private-project membership (confirmed product
// decision — "hide from others", not from admins themselves).
const getProjectsForSidebar = async (workspaceId, userId, workspaceRole = null) => {
  if (workspaceRole && ADMIN_ROLES.includes(workspaceRole)) {
    return Project.findAll({
      where: { workspaceId },
      attributes: ["id", "name", "type"],
      order: [["createdAt", "ASC"]],
    });
  }

  const privateProjectIds = await PrivateProjectMember.findAll({
    where: { userId, status: "active" },
    attributes: ["projectId"],
    raw: true,
  });

  const projectIds = privateProjectIds.map((p) => p.projectId);

  const projects = await Project.findAll({
    where: {
      workspaceId,
      [Op.or]: [
        { type: "public" },
        {
          type: "private",
          id: {
            [Op.in]: projectIds,
          },
        },
      ],
    },
    attributes: ["id", "name", "type"],
    order: [["createdAt", "ASC"]],
  });

  return projects;
};

// Guards a project-scoped resource: public projects are open to any
// workspace member (workspace-role check already happened via
// requirePermission); private ones require an active PrivateProjectMember,
// unless the caller is a workspace admin/owner (bypass). Shared by chat,
// tasks, documents, and whiteboards — the one place "can this user see this
// project" is decided.
const assertProjectAccess = async ({ projectId, workspaceId, userId, workspaceRole }) => {
  const project = await Project.findOne({
    where: { id: projectId, workspaceId },
    attributes: ["id", "type"],
  });

  if (!project) return false;
  if (project.type === "public") return true;
  if (workspaceRole && ADMIN_ROLES.includes(workspaceRole)) return true;

  const membership = await PrivateProjectMember.findOne({
    where: { projectId, userId, status: "active" },
  });
  return !!membership;
};

// Kept as a thin alias — this was the pre-existing name used by
// requireChatChannelAccess; new call sites should prefer assertProjectAccess.
const assertProjectChannelAccess = assertProjectAccess;

// One indexed query per list-fetch (not per row) so task/document/whiteboard
// list endpoints can annotate each embedded user with their current
// project-membership status without N+1 queries or writing a flag onto every
// historical row.
const getProjectMembershipMap = async (projectId) => {
  const rows = await PrivateProjectMember.findAll({
    where: { projectId },
    attributes: ["userId", "status"],
    raw: true,
  });

  return new Map(rows.map((r) => [r.userId, r.status]));
};

const listProjectMembers = async (projectId) => {
  return PrivateProjectMember.findAll({
    where: { projectId },
    include: [
      { association: "user", attributes: ["id", "username", "imageUrl", "email"] },
      { association: "removedByUser", attributes: ["id", "username"] },
      { association: "invitedByUser", attributes: ["id", "username"] },
    ],
    order: [["createdAt", "ASC"]],
  });
};

// Adding someone who was previously removed reactivates their existing row
// (clearing removal metadata) instead of inserting a duplicate — keeps the
// (projectId, userId) unique constraint meaningful and preserves the
// original createdAt as "first joined".
const addProjectMember = async (projectId, userId, invitedBy) => {
  const [member] = await PrivateProjectMember.findOrCreate({
    where: { projectId, userId },
    defaults: { status: "active", invitedBy },
  });

  if (member.status !== "active") {
    await member.update({
      status: "active",
      removedAt: null,
      removedBy: null,
      invitedBy,
    });
  }

  return member;
};

// Soft removal only — never deletes the row. Tasks/documents/whiteboards
// reference User.id directly (no FK to this table), so nothing downstream
// needs cleanup; the badge shown against this user's historical entries is
// derived from this one flag at read time via getProjectMembershipMap.
const removeProjectMember = async (projectId, userId, removedBy) => {
  const [updatedCount] = await PrivateProjectMember.update(
    { status: "removed", removedAt: new Date(), removedBy },
    { where: { projectId, userId, status: "active" } },
  );

  return updatedCount > 0;
};

// Not yet wired to a caller — this repo has no "remove workspace member"
// endpoint today. Call this from that endpoint once it exists, so someone
// kicked from the workspace doesn't keep stale "active" rows in every
// project of that workspace.
const removeAllProjectMembershipsInWorkspace = async (userId, workspaceId) => {
  const workspaceProjects = await Project.findAll({
    where: { workspaceId },
    attributes: ["id"],
    raw: true,
  });

  const [updatedCount] = await PrivateProjectMember.update(
    { status: "removed", removedAt: new Date() },
    {
      where: {
        userId,
        status: "active",
        projectId: { [Op.in]: workspaceProjects.map((p) => p.id) },
      },
    },
  );

  return updatedCount;
};

module.exports = {
  getProjectsForSidebar,
  assertProjectAccess,
  assertProjectChannelAccess,
  getProjectMembershipMap,
  listProjectMembers,
  addProjectMember,
  removeProjectMember,
  removeAllProjectMembershipsInWorkspace,
};
