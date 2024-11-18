// services/roomService.js
const { Room } = require("../models");
const { Op } = require("sequelize");
const whiteboardSessionService = require("./whiteboardSessionService");
const { RoomParticipant } = require("../models");

// Creates a new chat room and an initial whiteboard session
const createRoom = async (roomName, isPrivate, createdByID) => {
  try {
    const newRoom = await Room.create({ roomName, isPrivate, createdByID });
    await whiteboardSessionService.createSession({
      sessionName: `${roomName} - Initial Session`,
      roomID: newRoom.roomID,
      createdByID,
    });
    return newRoom.get({ plain: true });
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

// Fetches all chat rooms
const getAllRooms = async () => {
  try {
    const rooms = await Room.findAll({
      attributes: ["roomID", "roomName", "isPrivate", "createdByID"],
      raw: true,
    });
    return rooms;
  } catch (error) {
    console.error("Error retrieving rooms:", error);
    throw error;
  }
};

// Fetches a specific room by its ID
const getRoomById = async (roomID) => {
  try {
    const room = await Room.findByPk(roomID);
    if (!room) {
      throw new Error("Room not found");
    }
    return room.get({ plain: true });
  } catch (error) {
    console.error("Error retrieving room:", error);
    throw error;
  }
};

// Updates details of a specific room
const updateRoom = async (roomID, roomName, isPrivate) => {
  try {
    const updateData = { roomName, isPrivate };
    const [updated] = await Room.update(updateData, { where: { roomID } });
    return updated;
  } catch (error) {
    console.error("Error updating room:", error);
    throw error;
  }
};

// Deletes a specific room by its ID
const deleteRoom = async (roomID) => {
  try {
    const room = await Room.findByPk(roomID);
    if (!room) {
      throw new Error("Room not found");
    }
    await room.destroy();
    return roomID;
  } catch (error) {
    console.error("Error deleting room:", error);
    throw error;
  }
};

// Fetches all rooms a user is part of
const getRoomsForUser = async (userID) => {
  try {
    const rooms = await Room.findAll({
      where: {
        [Op.or]: [
          { createdByID: userID },
          { "$RoomParticipants.UserID$": userID },
        ],
      },
      include: [
        {
          model: RoomParticipant,
          where: { UserID: userID },
          required: false,
        },
      ],
      attributes: ["roomID", "roomName", "isPrivate", "createdByID"],
      raw: true,
    });
    return rooms;
  } catch (error) {
    console.error("Error retrieving rooms for user:", error);
    throw error;
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getRoomsForUser,
};
