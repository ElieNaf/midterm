const express = require("express");
const roomParticipantController = require("../controllers/roomParticipantsController");

const router = express.Router();

// Route to add a participant to a room
router.post("/", roomParticipantController.addParticipantController);

  
// Route to get all participants in a specific room
router.get("/room/:roomID", roomParticipantController.getAllParticipantsInRoomController);

// Route to get a single participant by ID
router.get("/:participantID", roomParticipantController.getParticipantController);

// Route to remove a participant from a room by participant ID
router.delete("/:participantID", roomParticipantController.removeParticipantController);

module.exports = router;
