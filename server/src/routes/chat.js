const express = require('express');
const router = express.Router();
const { postChat, history } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, postChat);
router.get('/history', authenticate, history);

module.exports = router;