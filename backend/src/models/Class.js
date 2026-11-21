const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School tenant ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Class / Grade name is required'], // e.g. "Grade 8"
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'], // e.g. "A"
      trim: true,
      default: 'A',
    },
    academicYear: {
      type: String,
      default: '2026-2027',
    },
    roomNumber: {
      type: String,
      default: 'Room 204',
    },
    homeroomTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    schedule: [
      {
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
        subject: String,
        startTime: String,
        endTime: String,
        teacherName: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

classSchema.index({ schoolId: 1, name: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
