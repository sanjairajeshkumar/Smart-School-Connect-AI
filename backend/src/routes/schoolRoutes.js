const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');
const permitRoles = require('../middleware/roleMiddleware');
const tenantGuard = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantGuard);

// Tenant Profile & Analytics
router.get('/profile', schoolController.getProfile);
router.put('/profile', permitRoles('school_admin', 'super_admin'), schoolController.updateProfile);
router.get('/analytics', permitRoles('school_admin', 'super_admin'), schoolController.getAnalytics);

// Academic Classes & Roster Management
router.get('/classes', schoolController.getClasses);
router.get('/classes/:id', schoolController.getClassDetails);
router.post('/classes', permitRoles('school_admin', 'super_admin'), schoolController.createClass);
router.post('/classes/:id/schedule', permitRoles('school_admin', 'super_admin'), schoolController.addScheduleItem);
router.delete('/classes/:id/schedule/:index', permitRoles('school_admin', 'super_admin'), schoolController.removeScheduleItem);
router.delete('/classes/:id/students/:studentId', permitRoles('school_admin', 'super_admin'), schoolController.unenrollStudent);
router.delete('/classes/:id/teachers/:teacherId', permitRoles('school_admin', 'super_admin'), schoolController.unassignTeacher);

// Users Directory & Member Management
router.get('/users', permitRoles('school_admin', 'teacher', 'super_admin'), schoolController.getUsers);
router.delete('/users/:id', permitRoles('school_admin', 'super_admin'), schoolController.removeUser);

// Invitations & Staff/Parent/Student Provisioning
router.get('/invitations', permitRoles('school_admin', 'super_admin'), schoolController.getInvitations);
router.post('/invitations', permitRoles('school_admin', 'super_admin'), schoolController.sendInvitation);
router.delete('/invitations/:id', permitRoles('school_admin', 'super_admin'), schoolController.revokeInvitation);

module.exports = router;
