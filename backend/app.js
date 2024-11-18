// backend/app.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const { sequelize } = require("./models");
const roomRoutes = require("./routes/roomRoutes");
const roomParticipantRoutes = require("./routes/roomParticipantsRoutes");
const chatMessageRoutes = require("./routes/chatMessageRoutes");
const whiteboardSessionRoutes = require("./routes/whiteboardSessionRoutes");
const whiteboardPermissionRoutes = require("./routes/whiteboardPermissionRoutes");
const whiteboardContentRoutes = require("./routes/whiteboardContentRoutes");
const socketHandlers = require("./sockets"); // Import socket handlers

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins; adjust for production
  },
});

// Initialize socket handlers
socketHandlers(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/room-participants", roomParticipantRoutes);
app.use("/api", chatMessageRoutes);
app.use("/api", whiteboardSessionRoutes);
app.use("/api", whiteboardPermissionRoutes);
app.use("/api", whiteboardContentRoutes);

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, "0.0.0.0", async () => {
  // Use `server.listen` instead of `app.listen`
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
  }
});

module.exports = app;
