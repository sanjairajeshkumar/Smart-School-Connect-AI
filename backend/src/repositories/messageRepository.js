const Message = require('../models/Message');

class MessageRepository {
  async findById(id) {
    return await Message.findById(id)
      .populate('senderId', 'name role email')
      .populate('recipientId', 'name role email');
  }

  async findForUser(userId, role, grade) {
    // Teachers see messages they sent or received
    // Parents see messages to their grade or specific to them
    const query = {
      $or: [
        { senderId: userId },
        { recipientId: userId },
        { recipientRole: 'all_grade_parents', grade: grade },
      ]
    };
    return await Message.find(query)
      .populate('senderId', 'name role avatar')
      .populate('recipientId', 'name role avatar')
      .sort({ createdAt: -1 });
  }

  async findThread(threadId) {
    return await Message.find({ threadId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });
  }

  async create(messageData) {
    return await Message.create(messageData);
  }

  async markAsRead(id) {
    return await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }

  async getRecentTeacherUpdates(grade) {
    return await Message.find({
      senderRole: 'teacher',
      grade: grade,
      teacherApproved: true
    })
      .sort({ createdAt: -1 })
      .limit(5);
  }
}

module.exports = new MessageRepository();
