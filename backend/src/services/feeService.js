const FeeInvoice = require('../models/FeeInvoice');
const User = require('../models/User');
const socketService = require('./socketService');

class FeeService {
  async getInvoices(user, queryParams = {}) {
    const schoolId = user.schoolId?._id || user.schoolId;
    const filter = { schoolId };

    if (queryParams.status && queryParams.status !== 'all') {
      filter.status = queryParams.status;
    }

    if (user.role === 'school_admin' || user.role === 'super_admin') {
      return await FeeInvoice.find(filter)
        .populate('studentId', 'name email grade section')
        .populate('parentId', 'name email phone')
        .sort({ dueDate: 1 });
    }

    if (user.role === 'parent') {
      const childIds = user.childrenIds || [];
      return await FeeInvoice.find({
        schoolId,
        $or: [{ parentId: user._id }, { studentId: { $in: childIds } }],
        ...filter,
      }).sort({ dueDate: 1 });
    }

    if (user.role === 'student') {
      return await FeeInvoice.find({
        schoolId,
        studentId: user._id,
        ...filter,
      }).sort({ dueDate: 1 });
    }

    return [];
  }

  async createInvoice(adminUser, { studentId, title, amount, dueDate, currency }) {
    if (adminUser.role !== 'school_admin' && adminUser.role !== 'super_admin') {
      throw new Error('Only school administrators can create fee invoices');
    }

    const student = await User.findById(studentId);
    if (!student) throw new Error('Student not found');

    const schoolId = adminUser.schoolId?._id || adminUser.schoolId;

    const invoice = await FeeInvoice.create({
      schoolId,
      studentId: student._id,
      studentName: student.name,
      parentId: student.parentId || null,
      title: title.trim(),
      amount: Number(amount),
      currency: currency || 'USD',
      dueDate: new Date(dueDate),
      status: 'pending',
    });

    if (student.parentId) {
      socketService.emitToUser(student.parentId, 'invoice:created', invoice);
    }
    socketService.emitToUser(student._id, 'invoice:created', invoice);

    return invoice;
  }

  async recordPayment(user, invoiceId, { paymentReference }) {
    const invoice = await FeeInvoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentReference = paymentReference || `REF-${Date.now()}`;
    await invoice.save();

    const schoolId = user.schoolId?._id || user.schoolId;
    socketService.emitToSchool(schoolId, 'invoice:paid', {
      invoiceId: invoice._id,
      amount: invoice.amount,
      studentName: invoice.studentName,
    });

    return invoice;
  }
}

module.exports = new FeeService();
