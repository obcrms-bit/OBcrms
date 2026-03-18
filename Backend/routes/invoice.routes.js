const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { protect, restrict } = require('../middleware/AuthMiddleware');

router.use(protect);

router.post('/', restrict('admin', 'accountant'), invoiceController.createInvoice);
router.get('/', restrict('admin', 'accountant'), invoiceController.getInvoices);
router.patch('/:id/status', restrict('admin', 'accountant'), invoiceController.updateInvoiceStatus);
router.post('/:id/send-email', restrict('admin', 'accountant'), invoiceController.sendInvoiceEmail);

module.exports = router;
