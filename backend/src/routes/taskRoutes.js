const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const permitRoles = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.post('/', permitRoles('teacher', 'staff'), taskController.createTask);
router.get('/', taskController.getTasks);
router.put('/:id', taskController.updateTask);
router.delete('/:id', permitRoles('teacher', 'parent', 'staff'), taskController.deleteTask);

// Task Batching & Sequencing for Parents
router.post('/batches', permitRoles('parent'), taskController.createBatch);
router.get('/batches', taskController.getBatches);
router.patch('/batches/:id/release', permitRoles('parent'), taskController.toggleBatchRelease);

module.exports = router;
