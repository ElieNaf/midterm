// services/whiteboardPermissionService.js
const { WhiteboardPermission } = require('../models');

class WhiteboardPermissionService {
  async createPermission(data) {
    return await WhiteboardPermission.create(data);
  }

  async getPermissionById(permissionID) {
    return await WhiteboardPermission.findByPk(permissionID);
  }

  async getPermissionsBySession(sessionID) {
    return await WhiteboardPermission.findAll({ where: { sessionID } });
  }

  async updatePermission(permissionID, data) {
    const permission = await WhiteboardPermission.findByPk(permissionID);
    if (permission) {
      await permission.update(data);
      return permission;
    }
    throw new Error('Permission not found');
  }

  async deletePermission(permissionID) {
    const permission = await WhiteboardPermission.findByPk(permissionID);
    if (permission) {
      await permission.destroy();
      return;
    }
    throw new Error('Permission not found');
  }
}

module.exports = new WhiteboardPermissionService();
