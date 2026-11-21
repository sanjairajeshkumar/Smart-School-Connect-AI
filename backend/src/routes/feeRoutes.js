const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middleware/authMiddleware');
const permitRoles = require('../middleware/roleMiddleware');
const tenantGuard = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(tenantGuard);

router.get('/', feeController.getInvoices);
router.post('/', permitRoles('school_admin', 'super_admin'), feeController.createInvoice);
router.post('/:id/pay', permitRoles('parent', 'school_admin', 'super_admin'), feeController.recordPayment);

module.exports = router;
