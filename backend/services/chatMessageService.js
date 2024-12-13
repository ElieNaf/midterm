const { ChatMessage, User } = require('../models');

class ChatMessageService {
  async createMessage(data) {
    return await ChatMessage.create(data);
  }

  async getMessagesBySession(sessionID) {
    return await ChatMessage.findAll({
      where: { sessionID },
      include: [
        {
          model: User,
          attributes: ["Username"], // Fetch only the Username field
        }
      ]
    });
  }

  async deleteMessage(messageID) {
    return await ChatMessage.destroy({ where: { messageID } });
  }
}

module.exports = new ChatMessageService();
