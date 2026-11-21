const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/student-pin', authController.studentPinLogin);
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/students', authMiddleware, authController.getLinkedStudents);

module.exports = router;
