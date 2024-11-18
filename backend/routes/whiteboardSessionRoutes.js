// routes/whiteboardSessionRoutes.js
const express = require('express');
const whiteboardSessionController = require('../controllers/whiteboardSessionController');

const router = express.Router();

router.post('/sessions', whiteboardSessionController.createSession);
router.get('/sessions', whiteboardSessionController.getAllSessions);
router.get('/sessions/:sessionID', whiteboardSessionController.getSessionById);
router.put('/sessions/:sessionID', whiteboardSessionController.updateSession);
router.delete('/sessions/:sessionID', whiteboardSessionController.deleteSession);

module.exports = router;
