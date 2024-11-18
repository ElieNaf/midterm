const roomParticipantService = require("../services/roomParticipantsService");

// Controller for adding a participant to a room
const addParticipantController = async (req, res) => {
  const { roomID, UserID } = req.body;
  try {
    const newParticipant = await roomParticipantService.addParticipant(
      roomID,
      UserID
    );
    res.status(201).json(newParticipant);
  } catch (error) {
    console.error("Error adding participant:", error.message);
    if (error.message === "User is already a participant in this room") {
      res.status(409).json({ error: error.message }); // Conflict error for duplicate participant
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

// Controller for retrieving all participants in a room
const getAllParticipantsInRoomController = async (req, res) => {
  const { roomID } = req.params;
  try {
    const participants = await roomParticipantService.getAllParticipantsInRoom(
      roomID
    );
    res.status(200).json(participants);
  } catch (error) {
    console.error("Error retrieving participants:", error.message);
    res.status(500).json({ error: "Failed to retrieve participants" });
  }
};

// Controller for retrieving a specific participant by their ID
const getParticipantController = async (req, res) => {
  const { participantID } = req.params;
  try {
    const participant = await roomParticipantService.getParticipant(
      participantID
    );
    res.status(200).json(participant);
  } catch (error) {
    console.error("Error retrieving participant:", error.message);
    res.status(404).json({ error: "Participant not found" });
  }
};

// Controller for removing a participant from a room
const removeParticipantController = async (req, res) => {
  const { participantID } = req.params;
  try {
    await roomParticipantService.removeParticipant(participantID);
    res.status(200).json({ message: "Participant removed successfully" });
  } catch (error) {
    console.error("Error removing participant:", error.message);
    res.status(404).json({ error: "Participant not found" });
  }
};

module.exports = {
  addParticipantController,
  getAllParticipantsInRoomController,
  getParticipantController,
  removeParticipantController,
};
