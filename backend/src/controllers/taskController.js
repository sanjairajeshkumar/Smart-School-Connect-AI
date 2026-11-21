const taskService = require('../services/taskService');

class TaskController {
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.user, req.body);
      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTasks(req, res, next) {
    try {
      const tasks = await taskService.getTasksForUser(req.user, req.query);
      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const updated = await taskService.updateTaskStatus(req.user, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteTask(req, res, next) {
    try {
      await taskService.deleteTask(req.user, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createBatch(req, res, next) {
    try {
      const batch = await taskService.createOrUpdateBatch(req.user, req.body);
      res.status(201).json({
        success: true,
        data: batch,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getBatches(req, res, next) {
    try {
      const { studentId } = req.query;
      const batches = await taskService.getBatches(req.user, studentId);
      res.status(200).json({
        success: true,
        data: batches,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleBatchRelease(req, res, next) {
    try {
      const { isReleased } = req.body;
      const updated = await taskService.toggleBatchRelease(req.user, req.params.id, isReleased);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new TaskController();
