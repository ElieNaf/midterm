// controllers/chatMessageController.js
const chatMessageService = require("../services/chatMessageService");

class ChatMessageController {
  async createMessage(req, res) {
    try {
      const message = await chatMessageService.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  }

  async getMessagesBySession(req, res) {
    try {
      const { sessionID } = req.params;
      const messages = await chatMessageService.getMessagesBySession(sessionID);
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error retrieving messages:", error);
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageID } = req.params;
      await chatMessageService.deleteMessage(messageID);
      res
        .status(200)
        .json({ message: "Message has been deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  }
}

module.exports = new ChatMessageController();
