// controllers/whiteboardSessionController.js
const whiteboardSessionService = require("../services/whiteboardSessionService");

class WhiteboardSessionController {
  // Controller for creating a whiteboard session
  async createSession(req, res) {
    try {
      const session = await whiteboardSessionService.createSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  }

  // Controller for retrieving session by ID
  async getSessionById(req, res) {
    try {
      const { sessionID } = req.params;
      const session = await whiteboardSessionService.getSessionById(sessionID);
      if (session) {
        res.status(200).json(session);
      } else {
        res.status(404).json({ error: "Session not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve session" });
    }
  }

  // Controller for retrieving all sessions
  async getAllSessions(req, res) {
    try {
      const sessions = await whiteboardSessionService.getAllSessions();
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve sessions" });
    }
  }

  // Controller for updating a session
  async updateSession(req, res) {
    try {
      const { sessionID } = req.params;
      const session = await whiteboardSessionService.updateSession(
        sessionID,
        req.body
      );
      res.status(200).json(session);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Controller for deleting a session
  async deleteSession(req, res) {
    try {
      const { sessionID } = req.params;
      await whiteboardSessionService.deleteSession(sessionID);
      res
        .status(200)
        .json({ message: "Session has been deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new WhiteboardSessionController();
