import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import "./WhiteboardSession.css";

const socket = io("http://localhost:3002"); 

const WhiteboardSession = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [contentID, setContentID] = useState(null); // Store content ID for updates

  // Fetch content ID and data when component loads
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#000";

    const fetchContent = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3002/api/content/session/${roomId}`
        );
        if (response.data) {
          setContentID(response.data.id); // Save content ID for updates
          if (response.data.data) {
            const img = new Image();
            img.src = response.data.data;
            img.onload = () => context.drawImage(img, 0, 0);
          }
        }
      } catch (error) {
        console.error("Error loading saved content:", error);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3002/api/messages/session/${roomId}`
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchContent();
    fetchMessages();

    // Join the session room and set up event listeners
    socket.emit("joinRoom", { sessionID: roomId });
    socket.on("startPath", (data) => {
      if (data.sessionID !== roomId) return;
      const context = canvas.getContext("2d");
      context.beginPath();
      context.moveTo(data.offsetX, data.offsetY);
    });

    socket.on("whiteboardUpdate", (data) => {
      if (data.sessionID !== roomId) return;
      const context = canvas.getContext("2d");
      context.beginPath();
      context.arc(data.offsetX, data.offsetY, 2, 0, Math.PI * 2);
      context.fillStyle = "#000";
      context.fill();
      context.closePath();
    });

    socket.on("endDrawing", () => {
      const context = canvas.getContext("2d");
      context.closePath();
    });

    socket.on("chatMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("startPath");
      socket.off("whiteboardUpdate");
      socket.off("endDrawing");
      socket.off("chatMessage");
      socket.emit("leaveRoom", { sessionID: roomId });
    };
  }, [roomId]);

  // Clear canvas and save the cleared state to the database
  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Clear the canvas visually
    context.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const blankDataURL = canvas.toDataURL("image/png"); // Blank canvas data URL

      if (!contentID) {
        console.error("Content ID not available. Cannot clear canvas.");
        return;
      }

      // Update the canvas in the database using PUT request
      await axios.put(`http://localhost:3002/api/content/${contentID}`, {
        sessionID: roomId,
        data: blankDataURL,
      });

      console.log("Canvas cleared and saved to database.");
    } catch (error) {
      console.error("Error clearing canvas:", error);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");

    context.beginPath();
    context.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);

    socket.emit("startPath", {
      sessionID: roomId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  let lastPosition = null;
  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const context = canvas.getContext("2d");
    if (lastPosition) {
      context.beginPath();
      context.moveTo(lastPosition.x, lastPosition.y); // Start from the last position
      context.lineTo(offsetX, offsetY); // Draw to the current position
      context.stroke();
      context.closePath();
    }

    lastPosition = { x: offsetX, y: offsetY }; // Update last position

    socket.emit("whiteboardUpdate", {
      sessionID: roomId,
      offsetX,
      offsetY,
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosition = null; // Reset last position when drawing stops
    socket.emit("endDrawing", { sessionID: roomId });
    saveDrawing();
  };

  const saveDrawing = async () => {
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      await axios.post(`http://localhost:3002/api/content`, {
        sessionID: roomId,
        contentType: "drawing",
        data: dataURL,
      });
    } catch (error) {
      console.error("Error saving drawing:", error);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (!userId || !username) {
      alert("You must be logged in to send messages.");
      return;
    }

    const newMessage = {
      sessionID: roomId,
      senderID: userId,
      senderName: username,
      messageText: message,
    };

    socket.emit("chatMessage", newMessage);
    setMessage("");
  };

  return (
    <div
      className="container"
      style={{
        backgroundImage: `url("/scribbleBackground.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex-container">
        {/* Whiteboard Section */}
        <div className="whiteboard-container">
          <h2>Whiteboard Session </h2>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <button className="clear-button" onClick={clearCanvas}>
            Clear Canvas
          </button>
        </div>

        {/* Chat Section */}
        <div className="chat-container">
          <h3>Chat</h3>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.senderName}:</strong> {msg.messageText}
              </div>
            ))}
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage} className="chat-send-button">
              <div className="svg-wrapper-1">
                <div className="svg-wrapper">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path
                      fill="currentColor"
                      d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                    ></path>
                  </svg>
                </div>
              </div>
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
      {/* Back Button */}
      <button
        className="back-button"
        onClick={() => navigate("/")} // Navigate to the homepage
      >
        Back to Homepage
      </button>
    </div>
  );
};

export default WhiteboardSession;
