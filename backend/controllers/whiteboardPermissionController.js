// controllers/whiteboardPermissionController.js
const whiteboardPermissionService = require("../services/whiteboardPermissionService");

class WhiteboardPermissionController {
  // Controller for creating permissions
  async createPermission(req, res) {
    try {
      const permission = await whiteboardPermissionService.createPermission(
        req.body
      );
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ error: "Failed to create permission" });
    }
  }

  // Controller for retrieving permission by its ID
  async getPermissionById(req, res) {
    try {
      const { permissionID } = req.params;
      const permission = await whiteboardPermissionService.getPermissionById(
        permissionID
      );
      if (permission) {
        res.status(200).json(permission);
      } else {
        res.status(404).json({ error: "Permission not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve permission" });
    }
  }

  // Controller for retrieving all permissions for a session
  async getPermissionsBySession(req, res) {
    try {
      const { sessionID } = req.params;
      const permissions =
        await whiteboardPermissionService.getPermissionsBySession(sessionID);
      res.status(200).json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve permissions" });
    }
  }

  // Controller for updating a specific permission
  async updatePermission(req, res) {
    try {
      const { permissionID } = req.params;
      const permission = await whiteboardPermissionService.updatePermission(
        permissionID,
        req.body
      );
      res.status(200).json(permission);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Controller for deleting a specific permission
  async deletePermission(req, res) {
    try {
      const { permissionID } = req.params;
      await whiteboardPermissionService.deletePermission(permissionID);
      res
        .status(200)
        .json({ message: "Permission has been deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new WhiteboardPermissionController();
