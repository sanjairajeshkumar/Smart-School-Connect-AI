const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
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
      default: 'Grade 8',
    },
    section: {
      type: String,
      default: 'A',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teacherName: {
      type: String,
      required: true,
      default: 'Teacher',
    },
    // Target student (specific student) or null for entire grade/class
    assignedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
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
    maxScore: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    studyMaterials: [
      {
        title: String,
        url: String,
        type: { type: String, default: 'document' },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
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

taskSchema.index({ schoolId: 1, classId: 1 });
taskSchema.index({ schoolId: 1, assignedStudentId: 1, status: 1 });
taskSchema.index({ schoolId: 1, teacherId: 1 });

module.exports = mongoose.model('Task', taskSchema);
