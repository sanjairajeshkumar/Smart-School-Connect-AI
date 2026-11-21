const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');
const permitRoles = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.post('/rewrite-draft', permitRoles('teacher', 'staff'), aiController.rewriteDraft);
router.post('/student-digest', permitRoles('teacher', 'staff', 'parent'), aiController.getStudentDigest);
router.post('/assistant', aiController.askAssistant);

module.exports = router;
