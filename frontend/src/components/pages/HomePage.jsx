import React, { useEffect, useState } from "react";
import {
  fetchRoomsForUser,
  deleteRoom,
  updateRoomName,
  createRoom,
  addParticipantToRoom,
  fetchUsers,
} from "../services/roomService";
import { Link } from "react-router-dom";
import "./homepage.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const HomePage = () => {
  // State to store rooms, errors, modal visibility, selected room, etc.
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]); // State for all users
  const [selectedUserID, setSelectedUserID] = useState(""); // State for selected user to add

  // Fetch rooms and users on component mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const roomsData = await fetchRoomsForUser(userId); // Fetch rooms where user is involved
        setRooms(roomsData);
      } catch (err) {
        setError("Failed to load rooms.");
      }
    };

    const loadUsers = async () => {
      try {
        const usersData = await fetchUsers();
        setAvailableUsers(usersData);
      } catch (err) {
        setError("Failed to load users.");
      }
    };

    loadRooms();
    loadUsers();
  }, []);

  // Create a new room
  const handleCreateRoom = async () => {
    const roomName = prompt("Enter the room name:");
    if (roomName) {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const newRoom = await createRoom(token, roomName, userId);
        setRooms([...rooms, newRoom]); // Update the rooms list
      } catch (err) {
        setError("Failed to create room.");
      }
    }
  };

  // Open the modal for editing/deleting a room
  const openModal = (room) => {
    setSelectedRoom(room);
    setNewRoomName(room.roomName);
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  // Delete a room
  const handleDeleteRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      await deleteRoom(token, selectedRoom.roomID);
      setRooms(rooms.filter((room) => room.roomID !== selectedRoom.roomID)); // Remove the deleted room from the list
      closeModal();
    } catch (err) {
      setError("Failed to delete room.");
    }
  };

  // Update a room's name
  const handleUpdateRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      await updateRoomName(token, selectedRoom.roomID, newRoomName);
      setRooms(
        rooms.map((room) =>
          room.roomID === selectedRoom.roomID
            ? { ...room, roomName: newRoomName }
            : room
        )
      );
      closeModal();
    } catch (err) {
      setError("Failed to update room.");
    }
  };

  // Add a participant to a room
  const handleAddParticipant = async (roomID) => {
    if (!selectedUserID) {
      alert("Please select a user to add.");
      return;
    }

    try {
      await addParticipantToRoom(roomID, selectedUserID);
      alert("User added successfully to the room!");
      setSelectedUserID(""); // Reset the selected user
    } catch (err) {
      setError("Failed to add user to the room.");
    }
  };

  return (
    <div
      className="homepage-container"
      style={{
        backgroundImage: `url(${
          process.env.PUBLIC_URL + "/scribbleBackground.png"
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2>My Rooms</h2>
      {error && <p className="error-message">{error}</p>}
      <button className="button-create-room" onClick={handleCreateRoom}>
        Create New Room
      </button>

      {/* Display list of rooms */}
      {rooms.length > 0 ? (
        <table className="rooms-table">
          <thead>
            <tr>
              <th>Room Name</th>
              <th>Add User</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.roomID}>
                <td>
                  <i
                    className="fas fa-cog gear-icon"
                    onClick={() => openModal(room)}
                    style={{ cursor: "pointer", marginRight: "10px" }}
                  ></i>
                  <Link to={`/whiteboard/${room.roomID}`} className="room-link">
                    {room.roomName}
                  </Link>
                </td>
                <td>
                  <select
                    value={selectedUserID}
                    onChange={(e) => setSelectedUserID(e.target.value)}
                  >
                    <option value="">Select a User</option>
                    {availableUsers.map((user) => (
                      <option key={user.UserID} value={user.UserID}>
                        {user.Username} ({user.UserID})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAddParticipant(room.roomID)}
                    style={{ marginLeft: "10px" }}
                  >
                    Add User
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No rooms available.</p>
      )}

      {/* Modal for editing or deleting a room */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <i className="fas fa-times close-icon" onClick={closeModal}></i>
            <h3>Edit or Delete Room</h3>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room Name"
            />
            <button onClick={handleUpdateRoom}>Save Changes</button>
            <button onClick={handleDeleteRoom}>Delete Room</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
