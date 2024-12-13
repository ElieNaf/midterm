import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import "./WhiteboardSession.css";

/**
 * Initialize Socket.io client connection.
 * Use REACT_APP_BASE_URL from environment variables or fallback to localhost.
 * This makes the app flexible for deployments in different environments.
 */
const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:3002";
const socket = io(baseURL);

const WhiteboardSession = () => {
  // Extract the roomId from URL parameters
  const { roomId } = useParams();
  const navigate = useNavigate();

  /** References to the main and overlay canvas elements for drawing and previews */
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  // State variables for the whiteboard
  const [isDrawing, setIsDrawing] = useState(false);    // Are we currently drawing?
  const [messages, setMessages] = useState([]);         // Chat messages in the session
  const [message, setMessage] = useState("");           // Current chat input text
  const [contentID, setContentID] = useState(null);     // ID of the saved whiteboard content
  const [isListening, setIsListening] = useState(false);// Is the mic currently recording speech?
  const [drawColor, setDrawColor] = useState("#000000");// Current pen/shape color
  const [lineWidth, setLineWidth] = useState(2);        // Current line thickness
  const [tool, setTool] = useState("pen");              // Current drawing tool: pen, rectangle, circle, or line
  const [cursors, setCursors] = useState({});           // Positions of other users' cursors
  const [showHelp, setShowHelp] = useState(false);      // Show/hide help modal

  // Refs for speech recognition and drawing positions
  const recognition = useRef(null);
  const lastPosition = useRef(null);    // Last known position when drawing pen strokes
  const startShapePos = useRef(null);   // Starting position for shape tools (rectangle, circle, line)

  /**
   * useEffect: Set up speech recognition, canvas configuration, fetch initial content & messages,
   * and establish socket event handlers when the component mounts or roomId changes.
   */
  useEffect(() => {
    // Set up speech recognition if available
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.lang = "en-US";
      recognition.current.interimResults = false;

      // Handle recognized speech results
      recognition.current.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          setMessage((prev) => `${prev} ${transcript}`);
        }
      };

      // Handle speech recognition errors
      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert(`Speech recognition error: ${event.error}`);
      };

      // When speech recognition ends, update state
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    // Configure canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineCap = "round";

    // Configure overlay canvas for shape previews
    const overlay = overlayRef.current;
    overlay.width = canvas.offsetWidth;
    overlay.height = canvas.offsetHeight;
    const overlayCtx = overlay.getContext("2d");
    overlayCtx.lineCap = "round";

    /**
     * Fetch existing whiteboard content from the server and load it into the canvas.
     * If previously saved data is found, draw it on the canvas so users resume from last state.
     */
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/content/session/${roomId}`);
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

    /**
     * Fetch chat messages from the server for this session.
     * Adds timestamps if not present, and sets state.
     */
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/messages/session/${roomId}`);
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

    // Call the content and message fetch functions
    fetchContent();
    fetchMessages();

    // Join the room via sockets
    socket.emit("joinRoom", { sessionID: roomId });

    // Socket event listeners for drawing, chat, clearing, cursors, etc.
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

      // Draw based on tool type
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
        // Default to pen strokes
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
      // Receive new chat messages and append them to the state
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
      // Update the positions of other users' cursors in real-time
      setCursors((prev) => ({ ...prev, [userID]: { x, y, color } }));
    });

    socket.on("userLeft", ({ userID }) => {
      // Remove the cursor of a user who left
      setCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[userID];
        return newCursors;
      });
    });

    // Cleanup event listeners on unmount or roomId change
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

  /**
   * startListening:
   * Initiates speech recognition if supported, allowing user to dictate chat messages.
   */
  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    } else {
      alert("Speech Recognition API not supported.");
    }
  };

  /**
   * stopListening:
   * Stops speech recognition and updates state accordingly.
   */
  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
  };

  /**
   * clearCanvasLocal:
   * Clears the main and overlay canvases visually without updating the server.
   */
  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const overlay = overlayRef.current.getContext("2d");
    overlay.clearRect(0, 0, canvas.width, canvas.height);
  };

  /**
   * clearCanvas:
   * Clears the canvas and updates the server with a blank state, then notifies everyone via socket.
   */
  const clearCanvas = async () => {
    clearCanvasLocal();
    const canvas = canvasRef.current;
    const blankDataURL = canvas.toDataURL("image/png");

    try {
      // Update the server with blank content
      if (!contentID) {
        const response = await axios.post(`${baseURL}/api/content`, {
          sessionID: roomId,
          contentType: "drawing",
          data: blankDataURL,
        });
        if (response.data && response.data.id) {
          setContentID(response.data.id);
        }
      } else {
        await axios.put(`${baseURL}/api/content/${contentID}`, {
          sessionID: roomId,
          data: blankDataURL,
        });
      }
      socket.emit("clearCanvas", { sessionID: roomId });
    } catch (error) {
      console.error("Error clearing canvas:", error);
    }
  };

  /**
   * saveDrawing:
   * After completing a stroke or shape, saves the current canvas state to the server so that
   * the session can resume from this state in the future.
   */
  const saveDrawing = async () => {
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      if (!contentID) {
        const response = await axios.post(`${baseURL}/api/content`, {
          sessionID: roomId,
          contentType: "drawing",
          data: dataURL,
        });
        if (response.data && response.data.id) {
          setContentID(response.data.id);
        }
      } else {
        await axios.put(`${baseURL}/api/content/${contentID}`, {
          sessionID: roomId,
          data: dataURL,
        });
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
    }
  };

  /**
   * sendMessage:
   * Sends the current chat message to the server and resets the input field if successful.
   * Requires user authentication (userId and username in localStorage).
   */
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

  /**
   * exportCanvas:
   * Exports the current canvas content as a PNG image for the user to download.
   */
  const exportCanvas = () => {
    const dataURL = canvasRef.current.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `whiteboard-export-${new Date().toISOString()}.png`;
    link.click();
  };

  /**
   * drawShapePreview:
   * Shows a live preview of the shape being drawn (rectangle, circle, line) on the overlay canvas as the user drags.
   */
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

  /**
   * startDrawing:
   * Initiates drawing based on the current tool. For pen, begins a stroke.
   * For shapes, records the start position.
   */
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
      // For shape tools, just record the start position
      setIsDrawing(true);
      startShapePos.current = { x, y };
    }
  };

  /**
   * draw:
   * On mouse move, if drawing pen, continue the stroke.
   * If using a shape tool, show a preview of the shape on the overlay.
   */
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
      // Show shape preview
      if (startShapePos.current) {
        drawShapePreview(tool, overlayCtx, startShapePos.current.x, startShapePos.current.y, offsetX, offsetY);
      }
    }
  };

  /**
   * stopDrawing:
   * On mouse up or leaving the canvas, finalize the stroke or shape,
   * send the final line/shape to the server, and save the drawing state.
   */
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
      await saveDrawing();
    } else if (tool === "rectangle" || tool === "circle" || tool === "line") {
      const ctx = canvas.getContext("2d");
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = drawColor;
      ctx.lineCap = "round";

      const startX = startShapePos.current.x;
      const startY = startShapePos.current.y;

      // Draw the final shape on the main canvas
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
      await saveDrawing();
    }
  };

  /**
   * sendCursorPosition:
   * Sends the user's current mouse position to the server so others see their cursor.
   */
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

  /**
   * toggleHelp:
   * Toggles the help modal that explains how to use the whiteboard session page.
   */
  const toggleHelp = () => {
    setShowHelp((prev) => !prev);
  };

  /**
   * Render the WhiteboardSession component:
   * - Drawing controls (color, size, tool)
   * - Export, help, and clear canvas options
   * - Canvas and overlay for drawing
   * - Chat messages and input
   * - Help modal for instructions
   * - Navigation back to homepage
   */
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

            <button onClick={exportCanvas} title="Export Canvas as PNG">Export</button>
            <button onClick={toggleHelp} title="Show Help">Help</button>
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

      {showHelp && (
        <div className="help-overlay">
          <div className="help-modal">
            <h3>Help & Instructions</h3>
            <p><strong>Brush Color:</strong> Choose the color of your pen or shape border.</p>
            <p><strong>Brush Size:</strong> Adjust the thickness of your pen or shape lines.</p>
            <p><strong>Tool:</strong> Select Pen for freehand drawing, or Rectangle/Circle/Line to draw shapes.  
               Click and drag to preview the shape before releasing the mouse.</p>
            <p><strong>Export:</strong> Download your current canvas as a PNG image.</p>
            <p><strong>Clear Canvas:</strong> Erase everything and start fresh.</p>
            <p><strong>Chat:</strong> Send messages to others in real-time.</p>
            <p><strong>Mic Button:</strong> Hold to use speech-to-text for the chat input.</p>
            <button onClick={toggleHelp}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhiteboardSession;
