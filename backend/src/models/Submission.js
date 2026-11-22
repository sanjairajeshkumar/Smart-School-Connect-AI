const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
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
    content: {
      type: String,
      default: '',
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachments: [
      {
        type: String,
      },
    ],
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late', 'returned'],
      default: 'submitted',
    },
    score: {
      type: Number,
      default: null,
    },
    maxScore: {
      type: Number,
      default: 100,
    },
    feedback: {
      type: String,
      default: '',
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ taskId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
