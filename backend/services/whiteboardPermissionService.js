// services/whiteboardPermissionService.js
const { WhiteboardPermission } = require("../models");

class WhiteboardPermissionService {
  // Creates a new permission for a session
  async createPermission(data) {
    return await WhiteboardPermission.create(data);
  }

  // Fetches a specific permission by its ID
  async getPermissionById(permissionID) {
    return await WhiteboardPermission.findByPk(permissionID);
  }

  // Fetches all permissions for a specific session
  async getPermissionsBySession(sessionID) {
    return await WhiteboardPermission.findAll({ where: { sessionID } });
  }

  // Updates a specific permission by its ID
  async updatePermission(permissionID, data) {
    const permission = await WhiteboardPermission.findByPk(permissionID);
    if (permission) {
      await permission.update(data);
      return permission;
    }
    throw new Error("Permission not found");
  }

  // Deletes a specific permission by its ID
  async deletePermission(permissionID) {
    const permission = await WhiteboardPermission.findByPk(permissionID);
    if (permission) {
      await permission.destroy();
      return;
    }
    throw new Error("Permission not found");
  }
}

module.exports = new WhiteboardPermissionService();
