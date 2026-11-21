const taskService = require('../services/taskService');

class TaskController {
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.user, req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTasks(req, res, next) {
    try {
      const tasks = await taskService.getTasksForUser(req.user, req.query);
      res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const updated = await taskService.updateTaskStatus(req.user, req.params.id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteTask(req, res, next) {
    try {
      await taskService.deleteTask(req.user, req.params.id);
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async submitAssignment(req, res, next) {
    try {
      const submission = await taskService.submitAssignment(req.user, req.params.id, req.body);
      res.status(201).json({ success: true, data: submission, message: 'Assignment submitted successfully!' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const submissions = await taskService.getTaskSubmissions(req.params.id);
      res.status(200).json({ success: true, data: submissions });
    } catch (error) {
      next(error);
    }
  }

  async gradeSubmission(req, res, next) {
    try {
      const graded = await taskService.gradeSubmission(req.user, req.params.submissionId, req.body);
      res.status(200).json({ success: true, data: graded, message: 'Grade recorded and student notified in real-time!' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createBatch(req, res, next) {
    try {
      const batch = await taskService.createOrUpdateBatch(req.user, req.body);
      res.status(201).json({ success: true, data: batch });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getBatches(req, res, next) {
    try {
      const batches = await taskService.getBatches(req.user, req.query.studentId);
      res.status(200).json({ success: true, count: batches.length, data: batches });
    } catch (error) {
      next(error);
    }
  }

  async toggleBatchRelease(req, res, next) {
    try {
      const batch = await taskService.toggleBatchRelease(req.user, req.params.id, req.body.isReleased);
      res.status(200).json({ success: true, data: batch });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new TaskController();
