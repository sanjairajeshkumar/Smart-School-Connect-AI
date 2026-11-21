const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['super_admin', 'school_admin', 'teacher', 'parent', 'student', 'staff'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['parent', 'teacher', 'all_grade_parents', 'all_school', 'all_students'],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
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
      default: 'School Announcement',
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
    teacherApproved: {
      type: Boolean,
      default: true,
    },
    isAnnouncement: {
      type: Boolean,
      default: false,
    },
    threadId: {
      type: String,
      default: '',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ schoolId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ schoolId: 1, classId: 1, createdAt: -1 });
messageSchema.index({ schoolId: 1, isAnnouncement: 1 });

module.exports = mongoose.model('Message', messageSchema);
