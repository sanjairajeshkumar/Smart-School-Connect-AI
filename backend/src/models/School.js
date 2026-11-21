const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'School slug identifier is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    billingEmail: {
      type: String,
      required: [true, 'Billing email is required'],
      trim: true,
      lowercase: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'],
      default: 'pro',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trial', 'past_due', 'cancelled'],
      default: 'active',
    },
    seatsLimit: {
      type: Number,
      default: 500,
    },
    currentAcademicYear: {
      type: String,
      default: '2026-2027',
    },
    logo: {
      type: String,
      default: '',
    },
    settings: {
      type: Object,
      default: {
        currency: 'USD',
        allowParentMessaging: true,
        autoSendAttendanceAlerts: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

schoolSchema.index({ billingEmail: 1 });

module.exports = mongoose.model('School', schoolSchema);
