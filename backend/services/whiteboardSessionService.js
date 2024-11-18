const { WhiteboardSession, Room, User } = require('../models');

class WhiteboardSessionService {
  async createSession(data) {
    return await WhiteboardSession.create(data);
  }

  async getSessionById(sessionID) {
    return await WhiteboardSession.findByPk(sessionID, {
      include: [
        { model: Room, attributes: ['roomID', 'roomName'] }, // Include Room details
        { model: User, attributes: ['userID', 'username'] }   // Include User details
      ]
    });
  }

  async getAllSessions() {
    return await WhiteboardSession.findAll({
      include: [
        { model: Room, attributes: ['roomID', 'roomName'] },
        { model: User, attributes: ['userID', 'username'] }
      ]
    });
  }

  async updateSession(sessionID, data) {
    const session = await WhiteboardSession.findByPk(sessionID);
    if (session) {
      await session.update(data);
      return session;
    }
    throw new Error('Session not found');
  }

  async deleteSession(sessionID) {
    const session = await WhiteboardSession.findByPk(sessionID);
    if (session) {
      await session.destroy();
      return;
    }
    throw new Error('Session not found');
  }
}

module.exports = new WhiteboardSessionService();
