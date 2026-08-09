"use strict";

module.exports = {
  up: async (queryInterface) => {
    // Recent activities: WHERE workspaceId = ? ORDER BY createdAt DESC
    await queryInterface.addIndex("RecentActivities", ["workspaceId", "createdAt"], {
      name: "recent_activities_workspace_created_idx",
    });

    // Sidebar projects: WHERE workspaceId = ? ORDER BY createdAt ASC
    await queryInterface.addIndex("Projects", ["workspaceId"], {
      name: "projects_workspace_idx",
    });

    // Sidebar projects: WHERE userId = ? (private membership lookup)
    await queryInterface.addIndex("PrivateProjectMembers", ["userId"], {
      name: "private_project_members_user_idx",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("RecentActivities", "recent_activities_workspace_created_idx");
    await queryInterface.removeIndex("Projects", "projects_workspace_idx");
    await queryInterface.removeIndex("PrivateProjectMembers", "private_project_members_user_idx");
  },
};
