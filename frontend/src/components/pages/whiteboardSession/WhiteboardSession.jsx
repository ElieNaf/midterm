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
  const overlayRef = useRef(null); // Overlay canvas for shape previews

  const [isDrawing, setIsDrawing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [contentID, setContentID] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [drawColor, setDrawColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState("pen");
  const [cursors, setCursors] = useState({});

  const recognition = useRef(null);
  const lastPosition = useRef(null);
  const startShapePos = useRef(null);

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
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineCap = "round";

    const overlay = overlayRef.current;
    overlay.width = canvas.offsetWidth;
    overlay.height = canvas.offsetHeight;
    const overlayCtx = overlay.getContext("2d");
    overlayCtx.lineCap = "round";

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
            img.onload = () => ctx.drawImage(img, 0, 0);
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

    socket.on("startPath", (data) => {
      if (data.sessionID !== roomId) return;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineWidth = data.lineWidth;
      ctx.strokeStyle = data.drawColor;
      ctx.moveTo(data.offsetX, data.offsetY);
    });

    socket.on("whiteboardUpdate", (data) => {
      if (data.sessionID !== roomId) return;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineWidth = data.lineWidth;
      ctx.strokeStyle = data.drawColor;

      if (data.tool === "rectangle") {
        const rectX = Math.min(data.lastX, data.offsetX);
        const rectY = Math.min(data.lastY, data.offsetY);
        const rectW = Math.abs(data.offsetX - data.lastX);
        const rectH = Math.abs(data.offsetY - data.lastY);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
      } else if (data.tool === "circle") {
        const radius = Math.sqrt((data.offsetX - data.lastX)**2 + (data.offsetY - data.lastY)**2);
        ctx.arc(data.lastX, data.lastY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (data.tool === "line") {
        ctx.moveTo(data.lastX, data.lastY);
        ctx.lineTo(data.offsetX, data.offsetY);
        ctx.stroke();
      } else {
        // pen
        ctx.moveTo(data.lastX, data.lastY);
        ctx.lineTo(data.offsetX, data.offsetY);
        ctx.stroke();
      }
      ctx.closePath();
    });

    socket.on("endDrawing", () => {
      ctx.closePath();
    });

    socket.on("chatMessage", (data) => {
      const timestampedMessage = {
        ...data,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, timestampedMessage]);
    });

    socket.on("clearCanvas", () => {
      clearCanvasLocal();
    });

    socket.on("cursorMove", ({ userID, x, y, color }) => {
      setCursors((prev) => ({ ...prev, [userID]: { x, y, color } }));
    });

    socket.on("userLeft", ({ userID }) => {
      setCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[userID];
        return newCursors;
      });
    });

    return () => {
      socket.off("startPath");
      socket.off("whiteboardUpdate");
      socket.off("endDrawing");
      socket.off("chatMessage");
      socket.off("clearCanvas");
      socket.off("cursorMove");
      socket.off("userLeft");
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

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const overlay = overlayRef.current.getContext("2d");
    overlay.clearRect(0, 0, canvas.width, canvas.height);
  };

  const clearCanvas = async () => {
    clearCanvasLocal();

    const canvas = canvasRef.current;
    const blankDataURL = canvas.toDataURL("image/png");

    try {
      // Update the saved content to blank
      if (!contentID) {
        const response = await axios.post("http://localhost:3002/api/content", {
          sessionID: roomId,
          contentType: "drawing",
          data: blankDataURL,
        });
        if (response.data && response.data.id) {
          setContentID(response.data.id);
        }
      } else {
        await axios.put(`http://localhost:3002/api/content/${contentID}`, {
          sessionID: roomId,
          data: blankDataURL,
        });
      }
      socket.emit("clearCanvas", { sessionID: roomId });
    } catch (error) {
      console.error("Error clearing canvas:", error);
    }
  };

  // Save the current drawing state to the server after each completed stroke/shape
  const saveDrawing = async () => {
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      // If we have a contentID, update the existing record, otherwise create a new one
      if (!contentID) {
        const response = await axios.post("http://localhost:3002/api/content", {
          sessionID: roomId,
          contentType: "drawing",
          data: dataURL,
        });
        if (response.data && response.data.id) {
          setContentID(response.data.id);
        }
      } else {
        await axios.put(`http://localhost:3002/api/content/${contentID}`, {
          sessionID: roomId,
          data: dataURL,
        });
      }
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

  const exportCanvas = () => {
    const dataURL = canvasRef.current.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `whiteboard-export-${new Date().toISOString()}.png`;
    link.click();
  };

  const drawShapePreview = (toolType, overlayCtx, startX, startY, endX, endY) => {
    overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height);
    overlayCtx.lineWidth = lineWidth;
    overlayCtx.strokeStyle = drawColor;
    overlayCtx.beginPath();
    if (toolType === "rectangle") {
      const rectX = Math.min(startX, endX);
      const rectY = Math.min(startY, endY);
      const rectW = Math.abs(endX - startX);
      const rectH = Math.abs(endY - startY);
      overlayCtx.strokeRect(rectX, rectY, rectW, rectH);
    } else if (toolType === "circle") {
      const radius = Math.sqrt((endX - startX)**2 + (endY - startY)**2);
      overlayCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
      overlayCtx.stroke();
    } else if (toolType === "line") {
      overlayCtx.moveTo(startX, startY);
      overlayCtx.lineTo(endX, endY);
      overlayCtx.stroke();
    }
    overlayCtx.closePath();
  };

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineCap = "round";
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;

      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      lastPosition.current = { x, y };

      socket.emit("startPath", {
        sessionID: roomId,
        offsetX: x,
        offsetY: y,
        lineWidth: lineWidth,
        drawColor: drawColor,
      });
    } else {
      // shapes
      setIsDrawing(true);
      startShapePos.current = { x, y };
    }
  };

  const draw = (e) => {
    sendCursorPosition(e);
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const overlayCtx = overlay.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (tool === "pen") {
      if (!lastPosition.current) return;
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
        tool: "pen",
      });

      lastPosition.current = { x: offsetX, y: offsetY };
    } else {
      // Show shape preview on overlay
      if (startShapePos.current) {
        drawShapePreview(tool, overlayCtx, startShapePos.current.x, startShapePos.current.y, offsetX, offsetY);
      }
    }
  };

  const stopDrawing = async (e) => {
    sendCursorPosition(e);
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const overlayCtx = overlay.getContext("2d");
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    if (tool === "pen") {
      lastPosition.current = null;
      socket.emit("endDrawing", { sessionID: roomId });
      // Save the board after finishing the stroke
      await saveDrawing();
    } else if (tool === "rectangle" || tool === "circle" || tool === "line") {
      const ctx = canvas.getContext("2d");
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = drawColor;
      ctx.lineCap = "round";

      const startX = startShapePos.current.x;
      const startY = startShapePos.current.y;

      // Draw final shape on main canvas
      ctx.beginPath();
      if (tool === "rectangle") {
        const rectX = Math.min(startX, endX);
        const rectY = Math.min(startY, endY);
        const rectW = Math.abs(endX - startX);
        const rectH = Math.abs(endY - startY);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
      } else if (tool === "circle") {
        const radius = Math.sqrt((endX - startX)**2 + (endY - startY)**2);
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "line") {
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      ctx.closePath();

      socket.emit("whiteboardUpdate", {
        sessionID: roomId,
        offsetX: endX,
        offsetY: endY,
        lastX: startX,
        lastY: startY,
        lineWidth,
        drawColor,
        tool: tool
      });
      socket.emit("endDrawing", { sessionID: roomId });

      startShapePos.current = null;
      // Save the board after finishing the shape
      await saveDrawing();
    }
  };

  const sendCursorPosition = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    socket.emit("cursorMove", {
      sessionID: roomId,
      x,
      y
    });
  };

  return (
    <div
      className="container"
      style={{
        backgroundImage: `url("/scribbleBackground.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onMouseMove={sendCursorPosition}
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

            <div className="tool-selector">
              <label htmlFor="toolSelect">Tool:</label>
              <select
                id="toolSelect"
                value={tool}
                onChange={(e) => setTool(e.target.value)}
              >
                <option value="pen">Pen</option>
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="line">Line</option>
              </select>
            </div>

            {/* Removed Undo/Redo buttons */}
            <button onClick={exportCanvas} title="Export Canvas as PNG">Export</button>
          </div>

          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ zIndex: 1 }}
            />
            <canvas
              ref={overlayRef}
              style={{ position: 'absolute', top:0, left:0, zIndex:2, pointerEvents:'none' }}
            />
            {Object.keys(cursors).map((id) => {
              const c = cursors[id];
              return (
                <div
                  key={id}
                  style={{
                    position: 'absolute',
                    top: c.y,
                    left: c.x,
                    width: '10px',
                    height: '10px',
                    backgroundColor: c.color || 'red',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                  }}
                />
              );
            })}
          </div>

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
