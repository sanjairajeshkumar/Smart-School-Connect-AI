const mongoose = require('mongoose');

const taskBatchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Batch title is required (e.g., Batch 1 - Today Priority)'],
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sequenceOrder: {
      type: Number,
      default: 1,
    },
    taskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    isReleased: {
      type: Boolean,
      default: true,
    },
    instructions: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TaskBatch', taskBatchSchema);
