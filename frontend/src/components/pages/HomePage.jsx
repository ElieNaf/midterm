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

/**
 * HomePage Component
 * 
 * This component displays a list of rooms that the currently logged-in user is associated with.
 * It allows the user to:
 * - Create new rooms.
 * - Edit or delete existing rooms (via a modal).
 * - Add participants to rooms by selecting from a modal list of users.
 * - View help instructions via a help modal.
 */
const HomePage = () => {
  // State for storing the user's rooms
  const [rooms, setRooms] = useState([]);
  // State for storing error messages (e.g., failed API calls)
  const [error, setError] = useState("");
  // State to control the visibility of the edit/delete modal
  const [showModal, setShowModal] = useState(false);
  // State to track which room is currently selected for editing/deletion
  const [selectedRoom, setSelectedRoom] = useState(null);
  // State for the new room name when editing an existing room
  const [newRoomName, setNewRoomName] = useState("");
  // State for available users that can be added to a room
  const [availableUsers, setAvailableUsers] = useState([]);

  // State for toggling the help modal visibility
  const [showHelp, setShowHelp] = useState(false);

  // State for the user selection modal
  // showUserModal: controls modal visibility
  // currentRoomID: tracks which room we are adding a user to
  // userSearch: controls the search query for filtering available users
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentRoomID, setCurrentRoomID] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  // Filtered list of users based on the userSearch input
  const filteredUsers = availableUsers.filter((user) =>
    user.Username.toLowerCase().includes(userSearch.toLowerCase())
  );

  /**
   * useEffect hook: Fetch rooms and users on component mount.
   * - loadRooms fetches the rooms for the logged-in user.
   * - loadUsers fetches all users in the system for the add-participant feature.
   */
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const roomsData = await fetchRoomsForUser(userId);
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

  /**
   * handleCreateRoom:
   * Prompts the user for a room name and then calls createRoom API to make a new room.
   * On success, updates the rooms state to include the newly created room.
   */
  const handleCreateRoom = async () => {
    const roomName = prompt("Enter the room name:");
    if (roomName) {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const newRoom = await createRoom(token, roomName, userId);
        setRooms([...rooms, newRoom]);
      } catch (err) {
        setError("Failed to create room.");
      }
    }
  };

  /**
   * openModal:
   * Opens the edit/delete modal for a specific room.
   * Sets the selected room and pre-fills the newRoomName state.
   */
  const openModal = (room) => {
    setSelectedRoom(room);
    setNewRoomName(room.roomName);
    setShowModal(true);
  };

  /**
   * closeModal:
   * Closes the edit/delete modal and resets the selected room.
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  /**
   * handleDeleteRoom:
   * Attempts to delete the currently selected room.
   * On success, removes the room from the local state so the UI updates accordingly.
   */
  const handleDeleteRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      await deleteRoom(token, selectedRoom.roomID);
      setRooms(rooms.filter((room) => room.roomID !== selectedRoom.roomID));
      closeModal();
    } catch (err) {
      setError("Failed to delete room.");
    }
  };

  /**
   * handleUpdateRoom:
   * Attempts to update the name of the currently selected room.
   * On success, updates the room name in the local rooms state.
   */
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

  /**
   * openUserModal:
   * Opens the modal that shows a list of users so that one can be added to a specific room.
   * Sets the currentRoomID for reference and clears the userSearch.
   */
  const openUserModal = (roomID) => {
    setCurrentRoomID(roomID);
    setUserSearch("");
    setShowUserModal(true);
  };

  /**
   * closeUserModal:
   * Closes the user selection modal and resets the search state.
   */
  const closeUserModal = () => {
    setShowUserModal(false);
    setCurrentRoomID(null);
    setUserSearch("");
  };

  /**
   * handleUserSelect:
   * When a user is clicked in the user modal, this function adds that user to the room.
   * On success, alerts the user and closes the modal.
   */
  const handleUserSelect = async (userID) => {
    try {
      await addParticipantToRoom(currentRoomID, userID);
      alert("User added successfully to the room!");
    } catch (err) {
      setError("Failed to add user to the room.");
    }
    closeUserModal();
  };

  /**
   * toggleHelp:
   * Toggles the visibility of the help modal that explains how to use the page.
   */
  const toggleHelp = () => {
    setShowHelp((prev) => !prev);
  };

  /**
   * Render the HomePage component:
   * - Displays a page title.
   * - Shows error messages if any.
   * - Provides a button to create a new room and a help button.
   * - Lists rooms in a table. Each room has an edit icon (gear) and an "Add User" button to open the user modal.
   * - Includes modals for editing/deleting rooms, adding users, and showing help instructions.
   */
  return (
    <div
      className="homepage-container"
      style={{
        backgroundImage: `url(${
          process.env.PUBLIC_URL + "/scribbleBackground.png"
        })`,
      }}
    >
      <h2>My Rooms</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="actions-container">
        <button className="button-create-room" onClick={handleCreateRoom}>
          Create New Room
        </button>
        <button className="button-help" onClick={toggleHelp}>
          Help
        </button>
      </div>

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
                  {/* Gear icon to open the edit/delete room modal */}
                  <i
                    className="fas fa-cog gear-icon"
                    title="Edit Room"
                    onClick={() => openModal(room)}
                    style={{ cursor: "pointer", marginRight: "10px" }}
                  ></i>
                  {/* Clicking the room name navigates to the whiteboard page for that room */}
                  <Link to={`/whiteboard/${room.roomID}`} className="room-link">
                    {room.roomName}
                  </Link>
                </td>
                <td>
                  {/* Button to open a modal for adding a user */}
                  <button onClick={() => openUserModal(room.roomID)}>
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

      {/* Modal for selecting a user (add participant) */}
      {showUserModal && (
        <div className="user-modal-overlay">
          <div className="user-modal-content">
            <i className="fas fa-times close-icon" onClick={closeUserModal}></i>
            <h3>Select a User</h3>
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <div className="user-list">
              {filteredUsers.map((user) => (
                <div
                  key={user.UserID}
                  className="user-item"
                  onClick={() => handleUserSelect(user.UserID)}
                >
                  <span className="user-name">{user.Username}</span>
                  <span className="user-id">({user.UserID})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help modal to explain how to use the homepage */}
      {showHelp && (
        <div className="help-overlay">
          <div className="help-modal">
            <h3>Help & Instructions</h3>
            <p>
              <strong>Create New Room:</strong> Click to add a new room. You will
              be prompted to give it a name.
            </p>
            <p>
              <strong>Gear Icon:</strong> Click the gear icon next to a room to
              edit its name or delete it.
            </p>
            <p>
              <strong>Add User:</strong> Click "Add User" to open a modal where
              you can select a user to add to the room.
            </p>
            <p>
              <strong>Rooms List:</strong> Click on a room's name to enter the
              whiteboard for that room.
            </p>
            <button onClick={toggleHelp}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
