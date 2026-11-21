const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['school_admin', 'teacher', 'parent', 'student'],
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Used if inviting a parent to link them to their child
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ schoolId: 1, email: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);
