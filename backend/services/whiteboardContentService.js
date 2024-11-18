// services/whiteboardContentService.js
const { WhiteboardContent } = require('../models');

class WhiteboardContentService {
  async createContent(data) {
    // Find the latest entry for the session and update it if it exists
    const latestContent = await WhiteboardContent.findOne({
      where: { sessionID: data.sessionID },
      order: [['createdAt', 'DESC']],
    });

    if (latestContent) {
      // Update the existing latest content
      await latestContent.update(data);
      return latestContent;
    } else {
      // If no content exists, create a new entry
      return await WhiteboardContent.create(data);
    }
  }
  async updateCanvas(contentID, sessionID, data) {
    try {
      const content = await WhiteboardContent.findOne({ where: { id: contentID, sessionID } });
      if (!content) {
        throw new Error('Content not found.');
      }
  
      // Update the content
      await content.update({ data });
      return content;
    } catch (error) {
      console.error("Error updating canvas:", error);
      throw new Error('Failed to update canvas.');
    }
  }
  
  async getContentBySession(sessionID) {
    // Retrieve the most recent content for the session
    return await WhiteboardContent.findOne({
      where: { sessionID },
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = new WhiteboardContentService();
