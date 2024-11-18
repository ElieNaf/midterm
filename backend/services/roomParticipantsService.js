// services/roomParticipantsService.js
const { RoomParticipant } = require("../models");

console.log("RoomParticipant model:", RoomParticipant);

// Adds a participant to a room, checking if they are already added
const addParticipant = async (roomID, UserID) => {
  try {
    const existingParticipant = await RoomParticipant.findOne({
      where: { roomID, UserID },
    });

    if (existingParticipant) {
      throw new Error("User is already a participant in this room");
    }

    const newParticipant = await RoomParticipant.create({ roomID, UserID });
    return newParticipant.get({ plain: true });
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
};

// Fetches all participants in a given room
const getAllParticipantsInRoom = async (roomID) => {
  try {
    const participants = await RoomParticipant.findAll({
      where: { roomID },
      attributes: ["participantID", "UserID", "joinedAt"],
      raw: true,
    });
    return participants;
  } catch (error) {
    console.error("Error retrieving participants:", error);
    throw error;
  }
};

// Fetches details of a specific participant by their ID
const getParticipant = async (participantID) => {
  try {
    const participant = await RoomParticipant.findByPk(participantID);
    if (!participant) {
      throw new Error("Participant not found");
    }
    return participant.get({ plain: true });
  } catch (error) {
    console.error("Error retrieving participant:", error);
    throw error;
  }
};

// Removes a participant from a room by their ID
const removeParticipant = async (participantID) => {
  try {
    const participant = await RoomParticipant.findByPk(participantID);
    if (!participant) {
      throw new Error("Participant not found");
    }
    await participant.destroy();
    return participantID;
  } catch (error) {
    console.error("Error removing participant:", error);
    throw error;
  }
};

module.exports = {
  addParticipant,
  getAllParticipantsInRoom,
  getParticipant,
  removeParticipant,
};
