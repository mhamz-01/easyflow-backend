const WORKSPACE_API = {
  GET_SINGLE_WORKSPACE: "/getSingleWorkspace",
  CHECK: "/check",
  GET_USER_WORKSPACES: "/getWorkspaces",
  GET_WORKSPACE_MEMBERS: "/workspaceMembers",
  GET_USER_WORKSPACE_INVITES: "/user/invites",
  CREATE: "/create",
  UPDATE_WORKSPACE_NAME: "/updateWorkspaceName",
  DELETE_WORKSPACE: "/deleteWorkspace",
  CREATE_INVITE: "/invite", // POST: create invite (email or link)
  ACCEPT_INVITE: "/invite/accept", // POST: accept invite
  ADD_USER: "/invite/add", // POST: add existing user instantly
  LIST_INVITES: "/invites",
  DELETE_INVITE: "/invite/delete",
};

module.exports = {
  WORKSPACE_API,
};
