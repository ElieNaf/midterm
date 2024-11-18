// routes/whiteboardContentRoutes.js
const express = require('express');
const whiteboardContentController = require('../controllers/whiteboardContentController');

const router = express.Router();

router.post('/content', whiteboardContentController.createContent);
router.get('/content/session/:sessionID', whiteboardContentController.getContentBySession);
router.put('/content/:contentID', whiteboardContentController.updateCanvas);
router.delete('/content/:contentID', whiteboardContentController.deleteContent);

module.exports = router;
