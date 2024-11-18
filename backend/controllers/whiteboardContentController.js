// controllers/whiteboardContentController.js
const whiteboardContentService = require("../services/whiteboardContentService");

class WhiteboardContentController {
  // Controller for creating whiteboard content
  async createContent(req, res) {
    try {
      const content = await whiteboardContentService.createContent(req.body);
      res.status(201).json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to create content" });
    }
  }

  // Controller for retrieving content by session ID
  async getContentBySession(req, res) {
    try {
      const { sessionID } = req.params;
      const content = await whiteboardContentService.getContentBySession(
        sessionID
      );
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve content" });
    }
  }

  // Controller for updating canvas content
  async updateCanvas(req, res) {
    const { contentID } = req.params;
    const { sessionID, data } = req.body;
    try {
      const updatedContent = await whiteboardContentService.updateCanvas(
        contentID,
        sessionID,
        data
      );
      res
        .status(200)
        .json({ message: "Canvas updated successfully", updatedContent });
    } catch (error) {
      res.status(500).json({ error: "Failed to update canvas" });
    }
  }

  // Controller for deleting whiteboard content
  async deleteContent(req, res) {
    try {
      const { contentID } = req.params;
      await whiteboardContentService.deleteContent(contentID);
      res
        .status(200)
        .json({ message: "Content has been deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new WhiteboardContentController();
