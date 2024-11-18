// routes/chatMessageRoutes.js
const express = require('express');
const chatMessageController = require('../controllers/chatMessageController');

const router = express.Router();

router.post('/messages', chatMessageController.createMessage);
router.get('/messages/session/:sessionID', chatMessageController.getMessagesBySession);
router.delete('/messages/:messageID', chatMessageController.deleteMessage);

module.exports = router;
