const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const permitRoles = require('../middleware/roleMiddleware');
const tenantGuard = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantGuard);

// School-wide Overview for Admins
router.get('/overview', permitRoles('school_admin', 'super_admin'), attendanceController.getSchoolOverview);

// Teacher/Admin can view class sheet & mark attendance
router.get('/class/:classId', permitRoles('teacher', 'school_admin', 'super_admin'), attendanceController.getClassAttendance);
router.post('/mark', permitRoles('teacher', 'school_admin', 'super_admin'), attendanceController.markAttendance);

// Parent/Teacher/Student can view student history
router.get('/student/:studentId', attendanceController.getStudentAttendance);

module.exports = router;
