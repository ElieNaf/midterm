const { RoomParticipant } = require("../models");
console.log("RoomParticipant model:", RoomParticipant);


const addParticipant = async (roomID, UserID) => {
  try {
    // Check if the participant already exists in the room
    const existingParticipant = await RoomParticipant.findOne({
      where: { roomID, UserID },
    });

    if (existingParticipant) {
      throw new Error("User is already a participant in this room");
    }

    // If the participant doesn't exist, create a new one
    const newParticipant = await RoomParticipant.create({
      roomID,
      UserID,
    });

    return newParticipant.get({ plain: true });
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
};



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

const getParticipant = async (participantID) => {
  console.log("getParticipant service called with participantID:", participantID);
  try {
    const participant = await RoomParticipant.findByPk(participantID);
    console.log("Participant found:", participant);
    if (!participant) {
      throw new Error("Participant not found");
    }
    return participant.get({ plain: true });
  } catch (error) {
    console.error("Error retrieving participant:", error);
    throw error;
  }
};



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
