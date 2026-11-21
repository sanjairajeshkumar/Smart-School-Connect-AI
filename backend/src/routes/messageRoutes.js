const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantGuard = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantGuard);

router.post('/', messageController.sendMessage);
router.get('/', messageController.getMessages);
router.patch('/:id/read', messageController.markAsRead);

module.exports = router;
