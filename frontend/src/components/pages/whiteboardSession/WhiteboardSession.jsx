import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import "./WhiteboardSession.css";

// Initialize Socket.io client connection
const socket = io("http://localhost:3002");

const WhiteboardSession = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [contentID, setContentID] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [drawColor, setDrawColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);

  const recognition = useRef(null);
  const lastPosition = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.lang = "en-US";
      recognition.current.interimResults = false;

      recognition.current.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          setMessage((prev) => `${prev} ${transcript}`);
        }
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert(`Speech recognition error: ${event.error}`);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API not supported.");
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    context.lineCap = "round";

    const fetchContent = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3002/api/content/session/${roomId}`
        );
        if (response.data) {
          setContentID(response.data.id);
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
        const timestampedMsgs = response.data.map((msg) => ({
          ...msg,
          time: msg.time
            ? msg.time
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setMessages(timestampedMsgs);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchContent();
    fetchMessages();

    socket.emit("joinRoom", { sessionID: roomId });

    // When receiving startPath from others
    socket.on("startPath", (data) => {
      if (data.sessionID !== roomId) return;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineWidth = data.lineWidth;
      ctx.strokeStyle = data.drawColor;
      ctx.moveTo(data.offsetX, data.offsetY);
    });

    // When receiving whiteboardUpdate from others
    socket.on("whiteboardUpdate", (data) => {
      if (data.sessionID !== roomId) return;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineWidth = data.lineWidth;
      ctx.strokeStyle = data.drawColor;
      ctx.moveTo(data.lastX, data.lastY);
      ctx.lineTo(data.offsetX, data.offsetY);
      ctx.stroke();
      ctx.closePath();
    });

    // When receiving endDrawing from others
    socket.on("endDrawing", () => {
      const ctx = canvas.getContext("2d");
      ctx.closePath();
    });

    // When receiving a chat message
    socket.on("chatMessage", (data) => {
      const timestampedMessage = {
        ...data,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, timestampedMessage]);
    });

    // NEW: When someone clears the canvas
    socket.on("clearCanvas", () => {
      // Just clear the local canvas here, no DB call
      clearCanvasLocal();
    });

    return () => {
      socket.off("startPath");
      socket.off("whiteboardUpdate");
      socket.off("endDrawing");
      socket.off("chatMessage");
      socket.off("clearCanvas");
      socket.emit("leaveRoom", { sessionID: roomId });
    };
  }, [roomId]);

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    } else {
      alert("Speech Recognition API not supported.");
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
  };

  // Clears the local canvas only (no socket, no DB)
  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Clears the canvas and updates the DB, then notifies others
  const clearCanvas = async () => {
    clearCanvasLocal(); // Clear my canvas first

    const canvas = canvasRef.current;
    const blankDataURL = canvas.toDataURL("image/png");

    try {
      if (!contentID) {
        // No existing content, create a new blank content entry
        const response = await axios.post("http://localhost:3002/api/content", {
          sessionID: roomId,
          contentType: "drawing",
          data: blankDataURL,
        });
        if (response.data && response.data.id) {
          setContentID(response.data.id);
        }
      } else {
        // Content exists, update it
        await axios.put(`http://localhost:3002/api/content/${contentID}`, {
          sessionID: roomId,
          data: blankDataURL,
        });
      }

      // After successful update, notify others to clear their canvas
      socket.emit("clearCanvas", { sessionID: roomId });
    } catch (error) {
      console.error("Error clearing canvas:", error);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    ctx.lineCap = "round";
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    lastPosition.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    socket.emit("startPath", {
      sessionID: roomId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      lineWidth: lineWidth,
      drawColor: drawColor,
    });
  };

  const draw = (e) => {
    if (!isDrawing || !lastPosition.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");

    ctx.lineCap = "round";
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.closePath();

    socket.emit("whiteboardUpdate", {
      sessionID: roomId,
      offsetX,
      offsetY,
      lastX: lastPosition.current.x,
      lastY: lastPosition.current.y,
      lineWidth: lineWidth,
      drawColor: drawColor,
    });

    lastPosition.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPosition.current = null;
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
        <div className="whiteboard-container">
          <h2>Whiteboard Session</h2>
          <div className="toolbar">
            <div className="color-picker-container">
              <label className="color-picker-label" htmlFor="colorPicker">Brush Color:</label>
              <input
                type="color"
                id="colorPicker"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                title="Select brush color"
              />
            </div>

            <div className="thickness-container">
              <label className="thickness-label" htmlFor="thicknessSlider">Brush Size:</label>
              <input
                type="range"
                id="thicknessSlider"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
                title="Adjust brush thickness"
              />
            </div>
          </div>

          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          <button className="clear-button" onClick={clearCanvas} title="Clear the whiteboard">
            Clear Canvas
          </button>
        </div>

        <div className="chat-container">
          <h3>Chat</h3>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className="chat-message">
                <strong>{msg.senderName}:</strong> {msg.messageText}
                {msg.time && <span className="message-time">({msg.time})</span>}
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
              title="Hold to speak"
            >
              🎙
            </button>
            <button onClick={sendMessage} className="chat-send-button" title="Send message">
              Send
            </button>
          </div>
        </div>
      </div>

      <button className="back-button" onClick={() => navigate("/")} title="Go back to homepage">
        Back to Homepage
      </button>
    </div>
  );
};

export default WhiteboardSession;
