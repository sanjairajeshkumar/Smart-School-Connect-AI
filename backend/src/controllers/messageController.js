const messageService = require('../services/messageService');

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const message = await messageService.sendMessage(req.user, req.body);
      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMessages(req, res, next) {
    try {
      const messages = await messageService.getMessages(req.user);
      res.status(200).json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentUpdates(req, res, next) {
    try {
      const grade = req.query.grade || req.user.grade || 'Grade 8';
      const updates = await messageService.getRecentTeacherUpdates(grade);
      res.status(200).json({
        success: true,
        data: updates,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();
