const mongoose = require('mongoose');

const feeInvoiceSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true, // e.g. "Term 1 Tuition & Lab Fees"
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    invoiceNumber: {
      type: String,
      default: () => 'INV-' + Math.floor(100000 + Math.random() * 900000),
    },
  },
  {
    timestamps: true,
  }
);

feeInvoiceSchema.index({ schoolId: 1, status: 1 });

module.exports = mongoose.model('FeeInvoice', feeInvoiceSchema);
