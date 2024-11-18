const roomService = require("../services/roomservice");

// Controller for creating a new room
const createRoomController = async (req, res) => {
  const { roomName, isPrivate, createdByID } = req.body;
  try {
    const newRoom = await roomService.createRoom(
      roomName,
      isPrivate,
      createdByID
    );
    res.status(201).json(newRoom);
  } catch (error) {
    console.error("Error creating room:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Controller for retrieving all rooms
const getAllRoomsController = async (req, res) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error retrieving rooms:", error.message);
    res.status(500).json({ error: "Failed to retrieve rooms" });
  }
};

// Controller for retrieving a specific room by its ID
const getRoomByIdController = async (req, res) => {
  const { roomID } = req.params;
  try {
    const room = await roomService.getRoomById(roomID);
    res.status(200).json(room);
  } catch (error) {
    console.error("Error retrieving room:", error.message);
    res.status(404).json({ error: "Room not found" });
  }
};

// Controller for updating room details
const updateRoomController = async (req, res) => {
  const { roomID } = req.params;
  const { roomName, isPrivate } = req.body;
  try {
    const updated = await roomService.updateRoom(roomID, roomName, isPrivate);
    if (updated === 1) {
      res.status(200).json({ message: "Room updated successfully" });
    } else {
      res.status(404).json({ error: "Room not found" });
    }
  } catch (error) {
    console.error("Error updating room:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Controller for deleting a room by its ID
const deleteRoomController = async (req, res) => {
  const { roomID } = req.params;
  try {
    await roomService.deleteRoom(roomID);
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error.message);
    res.status(404).json({ error: "Room not found" });
  }
};

// Controller for retrieving all rooms a user is part of
const getRoomsForUserController = async (req, res) => {
  const userID = req.params.userID;
  try {
    const rooms = await roomService.getRoomsForUser(userID);
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error retrieving rooms for user:", error.message);
    res.status(500).json({ error: "Failed to retrieve rooms for user" });
  }
};

module.exports = {
  createRoomController,
  getAllRoomsController,
  getRoomByIdController,
  updateRoomController,
  deleteRoomController,
  getRoomsForUserController,
};
