const chatMessageService = require("../services/chatMessageService");
const whiteboardContentService = require("../services/whiteboardContentService");

// A map to store user colors and other data if needed:
const userData = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    // Assign a random color for cursor:
    const cursorColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    userData[socket.id] = { color: cursorColor };

    socket.on("joinRoom", ({ sessionID }) => {
      socket.join(sessionID);
      socket.to(sessionID).emit("userJoined", { userID: socket.id });
      console.log(`User ${socket.id} joined room ${sessionID}`);
    });

    socket.on("startPath", (data) => {
      const { sessionID } = data;
      io.to(sessionID).emit("startPath", data);
    });

    socket.on("whiteboardUpdate", async (data) => {
      const { 
        sessionID, 
        contentType, 
        data: drawingData 
      } = data;

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
        io.to(sessionID).emit("whiteboardUpdate", data);
      }
    });

    socket.on("endDrawing", (data) => {
      const { sessionID } = data;
      io.to(sessionID).emit("endDrawing", { sessionID });
    });

    socket.on("clearCanvas", ({ sessionID }) => {
      io.to(sessionID).emit("clearCanvas");
      console.log(`Canvas cleared for session ${sessionID}`);
    });

    socket.on("chatMessage", async (data) => {
      console.log("Received chat message:", data);
      const { sessionID, senderID, senderName, messageText } = data;
      io.to(sessionID).emit("chatMessage", {
        senderID,
        senderName,
        messageText,
      });

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

    socket.on("userTyping", (data) => {
      const { sessionID, username } = data;
      socket.to(sessionID).emit("userTyping", { username });
    });

    // Real-time cursor
    socket.on("cursorMove", ({ sessionID, x, y }) => {
      if (userData[socket.id]) {
        const color = userData[socket.id].color;
        io.to(sessionID).emit("cursorMove", { userID: socket.id, x, y, color });
      }
    });

    // Load state for real-time undo/redo sync
    socket.on("loadState", ({ sessionID, dataURL }) => {
      io.to(sessionID).emit("loadState", { dataURL });
      console.log(`State loaded for session ${sessionID}`);
    });

    socket.on("leaveRoom", ({ sessionID }) => {
      socket.leave(sessionID);
      socket.to(sessionID).emit("userLeft", { userID: socket.id });
      console.log(`User ${socket.id} left room ${sessionID}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      delete userData[socket.id];
    });
  });
};
