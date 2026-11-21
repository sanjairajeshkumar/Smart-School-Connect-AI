const messageService = require('../services/messageService');

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const message = await messageService.sendMessage(req.user, req.body);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMessages(req, res, next) {
    try {
      const messages = await messageService.getMessages(req.user);
      res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const message = await messageService.markAsRead(req.user, req.params.id);
      res.status(200).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();
