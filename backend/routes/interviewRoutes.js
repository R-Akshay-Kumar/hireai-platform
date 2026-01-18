const express = require('express');
const router = express.Router();
const { startInterview, chat, getInterview } = require('../controllers/interviewController');

router.post('/start', startInterview);      // Start new session
router.post('/chat', chat);                 // Send answer, get next question
router.get('/:id', getInterview);           // Load history

module.exports = router;