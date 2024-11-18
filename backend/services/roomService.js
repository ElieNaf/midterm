const { Room } = require("../models");
const { Op } = require("sequelize");
const whiteboardSessionService = require("./whiteboardSessionService"); // Import the whiteboard session service
const {  RoomParticipant } = require("../models");

const createRoom = async (roomName, isPrivate, createdByID) => {
  try {
    const newRoom = await Room.create({
      roomName,
      isPrivate,
      createdByID,
    });

    // Automatically create a WhiteboardSession for the new room
    await whiteboardSessionService.createSession({
      sessionName: `${roomName} - Initial Session`,
      roomID: newRoom.roomID,
      createdByID: createdByID, // Or you can use a default system user if needed
    });

    return newRoom.get({ plain: true });
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

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

const updateRoom = async (roomID, roomName, isPrivate) => {
  try {
    const updateData = { roomName, isPrivate };
    const [updated] = await Room.update(updateData, {
      where: { roomID },
    });
    return updated; // 1 if the update was successful, 0 if not
  } catch (error) {
    console.error("Error updating room:", error);
    throw error;
  }
};

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
const getRoomsForUser = async (userID) => {
  try {
    const rooms = await Room.findAll({
      where: {
        [Op.or]: [
          { createdByID: userID },
          { '$RoomParticipants.UserID$': userID },
        ],
      },
      include: [
        {
          model: RoomParticipant,
          where: { UserID: userID },
          required: false, // Include rooms where the user is a participant
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
