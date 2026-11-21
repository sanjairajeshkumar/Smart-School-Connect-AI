const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const permitRoles = require('../middleware/roleMiddleware');

// Public Auth Routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/invite/:token', authController.getInviteDetails);
router.post('/accept-invite', authController.acceptInvite);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Authenticated Routes
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/students', authMiddleware, authController.getLinkedStudents);

// Superadmin Profile & Password Update (Only accessible when logged in as admin)
router.put('/superadmin/profile', authMiddleware, permitRoles('super_admin', 'school_admin'), authController.updateSuperAdminProfile);

module.exports = router;
