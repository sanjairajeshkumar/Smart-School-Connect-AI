const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['teacher', 'parent', 'staff'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['parent', 'teacher', 'all_grade_parents'],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null if broadcast to grade
    },
    recipientName: {
      type: String,
      default: 'Grade Parents',
    },
    grade: {
      type: String,
      default: 'Grade 8',
    },
    subject: {
      type: String,
      trim: true,
      default: 'School Update',
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    originalDraft: {
      type: String,
      default: '',
    },
    aiRewritten: {
      type: Boolean,
      default: false,
    },
    aiModelUsed: {
      type: String,
      default: '',
    },
    // Mandatory teacher review approval flag
    teacherApproved: {
      type: Boolean,
      default: true,
    },
    threadId: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ grade: 1, recipientRole: 1 });

module.exports = mongoose.model('Message', messageSchema);
