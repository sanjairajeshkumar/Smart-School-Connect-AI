const feeService = require('../services/feeService');

class FeeController {
  async getInvoices(req, res, next) {
    try {
      const invoices = await feeService.getInvoices(req.user, req.query);
      res.status(200).json({ success: true, count: invoices.length, data: invoices });
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req, res, next) {
    try {
      const invoice = await feeService.createInvoice(req.user, req.body);
      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async recordPayment(req, res, next) {
    try {
      const invoice = await feeService.recordPayment(req.user, req.params.id, req.body);
      res.status(200).json({ success: true, data: invoice, message: 'Fee payment recorded successfully!' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new FeeController();
