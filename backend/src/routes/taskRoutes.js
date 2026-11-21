const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const permitRoles = require('../middleware/roleMiddleware');
const tenantGuard = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantGuard);

// CRUD Tasks
router.post('/', permitRoles('teacher', 'school_admin', 'super_admin', 'staff'), taskController.createTask);
router.get('/', taskController.getTasks);
router.put('/:id', taskController.updateTask);
router.delete('/:id', permitRoles('teacher', 'school_admin', 'super_admin'), taskController.deleteTask);

// Submissions & Grading
router.post('/:id/submit', permitRoles('student'), taskController.submitAssignment);
router.get('/:id/submissions', permitRoles('teacher', 'school_admin', 'super_admin'), taskController.getSubmissions);
router.post('/submissions/:submissionId/grade', permitRoles('teacher', 'school_admin', 'super_admin'), taskController.gradeSubmission);

// Task Batching for Parents
router.post('/batches', permitRoles('parent'), taskController.createBatch);
router.get('/batches', taskController.getBatches);
router.patch('/batches/:id/release', permitRoles('parent'), taskController.toggleBatchRelease);

module.exports = router;
