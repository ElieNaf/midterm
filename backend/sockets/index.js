const chatMessageService = require("../services/chatMessageService");
const whiteboardContentService = require("../services/whiteboardContentService");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    // User joins a whiteboard session room
    socket.on("joinRoom", ({ sessionID }) => {
      socket.join(sessionID);
      socket.to(sessionID).emit("userJoined", { userID: socket.id });
      console.log(`User ${socket.id} joined room ${sessionID}`);
    });

    // Handle the startPath event from the sender
    socket.on("startPath", (data) => {
      const { sessionID, offsetX, offsetY, lineWidth, drawColor } = data;
      // Broadcast to everyone in the session (except sender)
      io.to(sessionID).emit("startPath", {
        sessionID,
        offsetX,
        offsetY,
        lineWidth,
        drawColor,
      });
    });

    // Handle the whiteboardUpdate event
    socket.on("whiteboardUpdate", async (data) => {
      const { 
        sessionID, 
        contentType, 
        data: drawingData, 
        offsetX, 
        offsetY, 
        lastX, 
        lastY, 
        lineWidth, 
        drawColor, 
        isDrawing 
      } = data;

      // If it's a save event with contentType and drawing data
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
        // Broadcast updated line segment with brush properties
        io.to(sessionID).emit("whiteboardUpdate", {
          sessionID,
          offsetX,
          offsetY,
          lastX,
          lastY,
          lineWidth,
          drawColor,
          isDrawing
        });
      }
    });

    // Handle endDrawing event
    socket.on("endDrawing", (data) => {
      const { sessionID } = data;
      // Broadcast the endDrawing event to everyone in the room
      io.to(sessionID).emit("endDrawing", { sessionID });
    });

    // NEW: Handle clearCanvas event
    socket.on("clearCanvas", ({ sessionID }) => {
      // Broadcast to all in the room that they should clear the canvas
      io.to(sessionID).emit("clearCanvas");
      console.log(`Canvas cleared for session ${sessionID}`);
    });

    // Handle chat messages
    socket.on("chatMessage", async (data) => {
      console.log("Received chat message:", data);

      const { sessionID, senderID, senderName, messageText } = data;

      // Broadcast the chat message to everyone in the room
      io.to(sessionID).emit("chatMessage", {
        senderID,
        senderName,
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

    // Handle typing indicator and broadcast
    socket.on("userTyping", (data) => {
      console.log("User typing event received:", data);
      const { sessionID, username } = data;
      socket.to(sessionID).emit("userTyping", { username });
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
