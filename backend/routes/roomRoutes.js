// roomRoutes.js
const express = require("express");
const roomController = require("../controllers/roomController");

const router = express.Router();

// Existing routes...
router.post("/", roomController.createRoomController);
router.get("/", roomController.getAllRoomsController);
router.get("/:roomID", roomController.getRoomByIdController);
router.put("/:roomID", roomController.updateRoomController);
router.delete("/:roomID", roomController.deleteRoomController);

// New route to get rooms for a specific user
router.get("/user/:userID", roomController.getRoomsForUserController);

module.exports = router;
