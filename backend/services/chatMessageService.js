// services/chatMessageService.js
const { ChatMessage } = require('../models');

class ChatMessageService {
  async createMessage(data) {
    return await ChatMessage.create(data);
  }

  async getMessagesBySession(sessionID) {
    return await ChatMessage.findAll({ where: { sessionID } });
  }

  async deleteMessage(messageID) {
    return await ChatMessage.destroy({ where: { messageID } });
  }
}

module.exports = new ChatMessageService();
