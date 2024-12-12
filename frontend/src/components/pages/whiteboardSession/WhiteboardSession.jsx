import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import "./WhiteboardSession.css";

// Initialize Socket.io client connection
const socket = io("http://localhost:3002");

const WhiteboardSession = () => {
  const { roomId } = useParams(); // Get roomId from URL parameters
  const navigate = useNavigate(); // Navigation hook for routing
  const canvasRef = useRef(null); // Reference to the canvas element
  const [isDrawing, setIsDrawing] = useState(false); // State to track drawing status
  const [messages, setMessages] = useState([]); // State to store chat messages
  const [message, setMessage] = useState(""); // State for new chat message
  const [contentID, setContentID] = useState(null); // State to store content ID for updates
  const [isListening, setIsListening] = useState(false); // State to track if mic is listening

  // Speech Recognition API setup
  const recognition = useRef(null);

  useEffect(() => {
    // Initialize SpeechRecognition API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.lang = "en-US"; // Set language
      recognition.current.interimResults = false; // Get final results only

      recognition.current.onresult = (event) => {
        console.log("Full recognition event:", event); // Log full event for debugging
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          console.log("Speech recognized:", transcript);
          setMessage((prev) => `${prev} ${transcript}`); // Append recognized text to the message
        } else {
          console.warn("No speech recognized.");
        }
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert(`Speech recognition error: ${event.error}`);
      };

      recognition.current.onend = () => {
        console.log("Recognition ended.");
        setIsListening(false); // Stop listening when recognition ends
      };
    } else {
      console.warn("Speech Recognition API is not supported in this browser.");
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions and properties
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#000";

    // Fetch whiteboard content from the server
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
            img.onload = () => context.drawImage(img, 0, 0); // Draw saved content
          }
        }
      } catch (error) {
        console.error("Error loading saved content:", error);
      }
    };

    // Fetch chat messages from the server
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

    // Join the room and set up socket listeners
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

  // Start listening to user input via the mic
  const startListening = () => {
    if (recognition.current) {
      console.log("Starting recognition...");
      setIsListening(true);
      recognition.current.start();
    } else {
      alert("Speech Recognition API is not supported in this browser.");
    }
  };

  // Stop listening to user input via the mic
  const stopListening = () => {
    if (recognition.current) {
      console.log("Stopping recognition...");
      recognition.current.stop();
    }
  };

  // Clear the canvas and save the cleared state to the database
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

      // Save cleared canvas state to the server
      await axios.put(`http://localhost:3002/api/content/${contentID}`, {
        sessionID: roomId,
        data: blankDataURL,
      });

      console.log("Canvas cleared and saved to database.");
    } catch (error) {
      console.error("Error clearing canvas:", error);
    }
  };

  // Start drawing on the canvas
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

  let lastPosition = null; // Track the last position for smoother drawing

  // Draw on the canvas
  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const context = canvas.getContext("2d");
    if (lastPosition) {
      context.beginPath();
      context.moveTo(lastPosition.x, lastPosition.y);
      context.lineTo(offsetX, offsetY);
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

  // Stop drawing and save the canvas content
  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosition = null;
    socket.emit("endDrawing", { sessionID: roomId });
    saveDrawing();
  };

  // Save the current drawing to the server
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

  // Send a chat message
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
      {/* Whiteboard Section */}
      <div className="flex-container">
        <div className="whiteboard-container">
          <h2>Whiteboard Session</h2>
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
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              className={`chat-mic-button ${isListening ? "mic-active" : ""}`}
            >
              🎙
            </button>
            <button onClick={sendMessage} className="chat-send-button">
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <button className="back-button" onClick={() => navigate("/")}>Back to Homepage</button>
    </div>
  );
};

export default WhiteboardSession;