// controllers/whiteboardContentController.js
const whiteboardContentService = require('../services/whiteboardContentService');

class WhiteboardContentController {
  async createContent(req, res) {
    try {
      const content = await whiteboardContentService.createContent(req.body);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ error: 'Failed to create content' });
    }
  }

  async getContentBySession(req, res) {
    try {
      const { sessionID } = req.params;
      const content = await whiteboardContentService.getContentBySession(sessionID);
      res.status(200).json(content);
    } catch (error) {
      console.error("Error retrieving content:", error);
      res.status(500).json({ error: 'Failed to retrieve content' });
    }
  }

  async updateCanvas(req, res) {
    const { contentID } = req.params;
    const { sessionID, data } = req.body;
  
    try {
      const updatedContent = await whiteboardContentService.updateCanvas(contentID, sessionID, data);
      res.status(200).json({ message: 'Canvas updated successfully.', updatedContent });
    } catch (error) {
      console.error("Error updating canvas:", error);
      res.status(500).json({ error: 'Failed to update canvas.' });
    }
  }
  

  async deleteContent(req, res) {
    try {
      const { contentID } = req.params;
      await whiteboardContentService.deleteContent(contentID);
      res.status(200).json({ message: 'Content has been deleted successfully' });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new WhiteboardContentController();
