const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade/Class is required'],
      default: 'Grade 8',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
      default: 'Teacher',
    },
    // Target student (specific student) or null for entire grade
    assignedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedParentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Time spent tracked by student (in minutes)
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
    // Student reflection / homework notes
    studentNotes: {
      type: String,
      default: '',
    },
    // Parent Task Batching & Sequencing fields
    parentBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskBatch',
      default: null,
    },
    batchName: {
      type: String,
      default: 'General Queue',
    },
    batchSequence: {
      type: Number,
      default: 1,
    },
    isReleasedToStudent: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performant querying by role
taskSchema.index({ assignedStudentId: 1, status: 1 });
taskSchema.index({ grade: 1, dueDate: 1 });
taskSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Task', taskSchema);
