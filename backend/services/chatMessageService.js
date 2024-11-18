// services/chatMessageService.js
const { ChatMessage } = require('../models');

class ChatMessageService {
  // Creates a new chat message
  async createMessage(data) {
    return await ChatMessage.create(data);
  }

  // Fetches all messages for a specific session
  async getMessagesBySession(sessionID) {
    return await ChatMessage.findAll({ where: { sessionID } });
  }

  // Deletes a specific chat message by its ID
  async deleteMessage(messageID) {
    return await ChatMessage.destroy({ where: { messageID } });
  }
}

module.exports = new ChatMessageService();
