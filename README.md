
# Scribble: Collaborative Whiteboard and Chat Application

## Overview

Scribble is a real-time collaborative whiteboard and chat application that allows multiple users to interact in shared rooms. Users can draw on a shared whiteboard, send chat messages, and manage rooms and permissions. The application is built with a Node.js backend and a React.js frontend, leveraging WebSockets for real-time communication.

---

## Features

- **User Authentication**
  - Login and signup functionalities with validation middleware.
  - User data managed via a `User` model.

- **Room Management**
  - Create, update, delete, and manage rooms.
  - Participant management in rooms, including permissions.

- **Collaborative Whiteboard**
  - Real-time drawing and whiteboard sessions.
  - Saving and retrieving whiteboard content using a database.

- **Chat System**
  - Send and receive messages within rooms.
  - Real-time communication powered by WebSockets.

- **Permissions**
  - Assign and validate permissions for room participants.
  - Custom middleware for authentication and validation.

---

## Folder Structure

### Backend
```
backend/
├── controllers/          # Handles HTTP requests and responses
│   ├── chatMessageController.js
│   ├── roomController.js
│   ├── roomParticipantsController.js
│   ├── userController.js
│   ├── whiteboardContentController.js
│   ├── whiteboardPermissionController.js
│   └── whiteboardSessionController.js
├── database/             # Database configuration and setup
├── middleware/           # Authentication and validation middleware
│   ├── authMiddleware.js
│   └── validate.js
├── models/               # Sequelize models for database entities
│   ├── ChatMessage.js
│   ├── Room.js
│   ├── RoomParticipants.js
│   ├── User.js
│   ├── WhiteboardContent.js
│   └── WhiteboardPermission.js
├── routes/               # Backend API routes
│   ├── chatMessageRoutes.js
│   ├── roomParticipantsRoutes.js
│   ├── roomRoutes.js
│   ├── userRoutes.js
│   ├── whiteboardContentRoutes.js
│   └── whiteboardSessionRoutes.js
├── services/             # Business logic for controllers
│   ├── chatMessageService.js
│   ├── roomParticipantsService.js
│   ├── roomService.js
│   ├── userService.js
│   └── whiteboardContentService.js
├── sockets/              # WebSocket configuration for real-time communication
│   └── index.js
├── app.js                # Application entry point
└── .env                  # Environment variables
```

### Frontend
```
frontend/
├── public/               # Public assets (e.g., index.html)
├── src/
│   ├── components/       # Reusable UI components
│   │   └── datagrid/     # DataGrid for displaying information
│   ├── pages/            # Application pages
│   │   ├── whiteboardSession/
│   │   │   ├── WhiteboardSession.jsx
│   │   │   └── WhiteboardSession.css
│   │   ├── homepage/
│   │   │   ├── HomePage.jsx
│   │   │   └── homepage.css
│   │   └── user/
│   │       ├── signup.jsx
│   │       ├── signup.css
│   │       ├── login.jsx
│   │       └── login.css
│   ├── services/         # API service utilities for frontend
│   │   ├── loginService.js
│   │   └── roomService.js
│   ├── App.js            # Main application component
│   ├── index.js          # React application entry point
│   └── index.css         # Global styles
├── package.json          # Frontend dependencies
└── .env                  # Environment variables
```

---

## Technologies

### Backend
- **Framework:** Node.js with Express.js
- **Database:** Sequelize ORM with MySQL
- **WebSockets:** Socket.IO for real-time communication
- **Validation:** Custom middleware and validators
- **Environment Variables:** `dotenv` for secure configuration

### Frontend
- **Framework:** React.js
- **Styling:** CSS modules for modular and reusable styles
- **API Communication:** Axios for HTTP requests
- **WebSockets:** Socket.IO-client for real-time updates

---

## Setup Instructions

### Prerequisites
- Node.js installed (v14+)
- MySQL database setup
- Frontend and backend dependencies installed via `npm`

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd test
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   - Add database credentials and environment variables.
4. Run the server:
   ```bash
   npm run dev 
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd test
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

---

## API Endpoints

### Authentication
- `POST /api/users/signup`: Create a new user
- `POST /api/users/login`: Login user

### Rooms
- `POST /api/rooms`: Create a new room
- `GET /api/rooms`: Get all rooms
- `PUT /api/rooms/:id`: Update a room
- `DELETE /api/rooms/:id`: Delete a room

### Whiteboard
- `GET /api/whiteboardContent/session/:sessionID`: Fetch session content
- `POST /api/whiteboardContent`: Save session content

### Chat
- `POST /api/chat/messages`: Send a message
- `GET /api/chat/messages/session/:sessionID`: Fetch session messages

---

## How to Use

1. **Sign Up and Login:**
   - Create a new account or log in to an existing account.

2. **Create or Join a Room:**
   - Create a new room or join an existing one to start collaborating.

3. **Collaborate:**
   - Draw on the shared whiteboard in real time and send messages to other participants.

4. **Manage Rooms:**
   - Assign permissions and manage participants.

---

## Contributing

Feel free to fork this repository and submit pull requests for new features, bug fixes, or enhancements.

---

## License

This project is licensed under the MIT License.
