// services/whiteboardSessionService.js
const { WhiteboardSession, Room, User } = require("../models");

class WhiteboardSessionService {
  // Creates a new whiteboard session
  async createSession(data) {
    return await WhiteboardSession.create(data);
  }

  // Fetches a specific session by its ID, including related Room and User details
  async getSessionById(sessionID) {
    return await WhiteboardSession.findByPk(sessionID, {
      include: [
        { model: Room, attributes: ["roomID", "roomName"] },
        { model: User, attributes: ["userID", "username"] },
      ],
    });
  }

  // Fetches all whiteboard sessions with related Room and User details
  async getAllSessions() {
    return await WhiteboardSession.findAll({
      include: [
        { model: Room, attributes: ["roomID", "roomName"] },
        { model: User, attributes: ["userID", "username"] },
      ],
    });
  }

  // Updates a specific session by its ID
  async updateSession(sessionID, data) {
    const session = await WhiteboardSession.findByPk(sessionID);
    if (session) {
      await session.update(data);
      return session;
    }
    throw new Error("Session not found");
  }

  // Deletes a specific session by its ID
  async deleteSession(sessionID) {
    const session = await WhiteboardSession.findByPk(sessionID);
    if (session) {
      await session.destroy();
      return;
    }
    throw new Error("Session not found");
  }
}

module.exports = new WhiteboardSessionService();
