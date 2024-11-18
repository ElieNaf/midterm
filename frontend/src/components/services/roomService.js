// services/roomService.js
import axios from "axios";

const API_URL = "http://localhost:3002/api/rooms"; // Base API URL for room operations
const USERS_API_URL = "http://localhost:3002/api/users"; // API URL for user data
const PARTICIPANTS_API_URL = "http://localhost:3002/api/room-participants"; // API URL for participants

// Fetch all rooms for the authenticated user
export const fetchRooms = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` }, // Include token in the request header
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to load rooms.");
  }
};

// Fetch all users from the database
export const fetchUsers = async () => {
  try {
    const response = await axios.get(USERS_API_URL);
    return response.data;
  } catch (error) {
    throw new Error("Failed to load users.");
  }
};

// Fetch all rooms where a specific user is a participant or the creator
export const fetchRoomsForUser = async (userID) => {
  try {
    const response = await axios.get(`${API_URL}/user/${userID}`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to load rooms for user.");
  }
};

// Add a new participant to a room
export const addParticipantToRoom = async (roomID, userID) => {
  try {
    const response = await axios.post(PARTICIPANTS_API_URL, {
      roomID,
      UserID: userID,
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to add participant to the room.");
  }
};

// Delete a room by its ID
export const deleteRoom = async (token, roomID) => {
  try {
    await axios.delete(`${API_URL}/${roomID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw new Error("Failed to delete room.");
  }
};

// Update the name of a specific room
export const updateRoomName = async (token, roomID, newRoomName) => {
  try {
    const response = await axios.put(
      `${API_URL}/${roomID}`,
      { roomName: newRoomName },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update room.");
  }
};

// Create a new room
export const createRoom = async (
  token,
  roomName,
  createdByID,
  isPrivate = false
) => {
  try {
    const response = await axios.post(
      API_URL,
      { roomName, isPrivate, createdByID },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to create room.");
  }
};
