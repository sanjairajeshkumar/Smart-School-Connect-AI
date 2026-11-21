const Task = require('../models/Task');

class TaskRepository {
  async findById(id) {
    return await Task.findById(id)
      .populate('teacherId', 'name email')
      .populate('assignedStudentId', 'name grade section')
      .populate('parentBatchId');
  }

  async findByStudent(studentId, filter = {}) {
    const query = {
      $or: [
        { assignedStudentId: studentId },
        { assignedStudentId: null } // Tasks broadcast to whole grade
      ],
      ...filter,
    };
    return await Task.find(query).sort({ dueDate: 1, createdAt: -1 });
  }

  async findByGrade(grade, filter = {}) {
    return await Task.find({ grade, ...filter }).sort({ dueDate: 1 });
  }

  async findByTeacher(teacherId, filter = {}) {
    return await Task.find({ teacherId, ...filter })
      .populate('assignedStudentId', 'name grade pin')
      .sort({ createdAt: -1 });
  }

  async create(taskData) {
    return await Task.create(taskData);
  }

  async update(id, updateData) {
    return await Task.findByIdAndUpdate(id, updateData, { new: true })
      .populate('teacherId', 'name email')
      .populate('assignedStudentId', 'name grade');
  }

  async delete(id) {
    return await Task.findByIdAndDelete(id);
  }

  async count(filter) {
    return await Task.countDocuments(filter);
  }

  async aggregateStats(filter = {}) {
    return await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMinutes: { $sum: '$timeSpentMinutes' },
          avgMinutes: { $avg: '$timeSpentMinutes' }
        }
      }
    ]);
  }
}

module.exports = new TaskRepository();
