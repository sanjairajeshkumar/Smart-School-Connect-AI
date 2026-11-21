const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', messageController.sendMessage);
router.get('/', messageController.getMessages);
router.get('/recent', messageController.getRecentUpdates);

module.exports = router;
