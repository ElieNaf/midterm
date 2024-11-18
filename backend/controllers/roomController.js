const roomService = require("../services/roomservice");

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

const getAllRoomsController = async (req, res) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error retrieving rooms:", error.message);
    res.status(500).json({ error: "Failed to retrieve rooms" });
  }
};

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
