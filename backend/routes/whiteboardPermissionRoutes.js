// routes/whiteboardPermissionRoutes.js
const express = require("express");
const whiteboardPermissionController = require("../controllers/whiteboardPermissionController");

const router = express.Router();

router.post("/permissions", whiteboardPermissionController.createPermission);
router.get(
  "/permissions/:permissionID",
  whiteboardPermissionController.getPermissionById
);
router.get(
  "/permissions/session/:sessionID",
  whiteboardPermissionController.getPermissionsBySession
);
router.put(
  "/permissions/:permissionID",
  whiteboardPermissionController.updatePermission
);
router.delete(
  "/permissions/:permissionID",
  whiteboardPermissionController.deletePermission
);

module.exports = router;
