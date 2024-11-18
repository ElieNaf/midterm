const chatMessageService = require("../services/chatMessageService"); // Correct import

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    // User joins a whiteboard session room
    socket.on("joinRoom", ({ sessionID }) => {
      socket.join(sessionID);
      socket.to(sessionID).emit("userJoined", { userID: socket.id });
      console.log(`User ${socket.id} joined room ${sessionID}`);
    });

    // Listen for whiteboard updates and broadcast to the room
    socket.on("whiteboardUpdate", async (data) => {
      const { sessionID, contentType, data: drawingData, offsetX, offsetY, isDrawing } = data;

      if (contentType && drawingData) {
        try {
          await whiteboardContentService.createContent({
            sessionID,
            contentType,
            data: drawingData,
          });
          console.log(`Auto-saved drawing for session ${sessionID}`);
        } catch (error) {
          console.error("Error auto-saving drawing:", error);
        }
      } else {
        io.to(sessionID).emit("whiteboardUpdate", { sessionID, offsetX, offsetY, isDrawing });
      }
    });

    // Listen for chat messages and broadcast to the room
    socket.on("chatMessage", async (data) => {
      console.log("Received chat message:", data);

      // Extract details from the message
      const { sessionID, senderID, senderName, messageText } = data;

      // Broadcast the chat message to everyone in the room
      io.to(sessionID).emit("chatMessage", {
        senderID,
        senderName, // Include the sender's name in the broadcast
        messageText,
      });

      // Save the chat message to the database
      try {
        await chatMessageService.createMessage({
          sessionID,
          senderID,
          messageText,
        });
        console.log(`Saved chat message for session ${sessionID}`);
      } catch (error) {
        console.error("Error saving chat message:", error);
      }
    });

    // Handle user leaving a room
    socket.on("leaveRoom", ({ sessionID }) => {
      socket.leave(sessionID);
      socket.to(sessionID).emit("userLeft", { userID: socket.id });
      console.log(`User ${socket.id} left room ${sessionID}`);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
