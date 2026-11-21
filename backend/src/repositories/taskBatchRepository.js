const TaskBatch = require('../models/TaskBatch');

class TaskBatchRepository {
  async findById(id) {
    return await TaskBatch.findById(id).populate('taskIds');
  }

  async findByParentAndStudent(parentId, studentId) {
    return await TaskBatch.find({ parentId, studentId })
      .populate('taskIds')
      .sort({ sequenceOrder: 1 });
  }

  async create(batchData) {
    return await TaskBatch.create(batchData);
  }

  async update(id, updateData) {
    return await TaskBatch.findByIdAndUpdate(id, updateData, { new: true }).populate('taskIds');
  }

  async delete(id) {
    return await TaskBatch.findByIdAndDelete(id);
  }
}

module.exports = new TaskBatchRepository();
