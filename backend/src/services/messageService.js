const Message = require('../models/Message');
const User = require('../models/User');
const socketService = require('./socketService');

class MessageService {
  async sendMessage(senderUser, data) {
    const { recipientId, recipientRole, subject, content, originalDraft, aiRewritten, aiModelUsed, threadId, grade, isAnnouncement, classId } = data;

    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const schoolId = senderUser.schoolId?._id || senderUser.schoolId;
    let targetGrade = grade || senderUser.grade || 'Grade 8';
    let recipientName = isAnnouncement ? 'School Announcement' : 'All Parents';

    if (recipientId) {
      const recipient = await User.findById(recipientId);
      if (recipient) {
        recipientName = recipient.name;
        targetGrade = recipient.grade || targetGrade;
      }
    }

    const message = await Message.create({
      schoolId,
      classId: classId || senderUser.classId || null,
      senderId: senderUser._id,
      senderRole: senderUser.role,
      senderName: senderUser.name,
      recipientRole: recipientRole || (isAnnouncement ? 'all_school' : 'parent'),
      recipientId: recipientId || null,
      recipientName,
      grade: targetGrade,
      subject: subject || (isAnnouncement ? 'Announcement' : 'School Communication'),
      content: content.trim(),
      originalDraft: originalDraft || '',
      aiRewritten: !!aiRewritten,
      aiModelUsed: aiModelUsed || '',
      teacherApproved: true,
      isAnnouncement: !!isAnnouncement,
      threadId: threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      readBy: [senderUser._id],
    });

    // Broadcast in real-time
    if (isAnnouncement) {
      socketService.emitToSchool(schoolId, 'announcement:new', message);
    } else if (recipientId) {
      socketService.emitToUser(recipientId, 'message:new', message);
      socketService.emitToUser(senderUser._id, 'message:new', message);
    } else {
      socketService.emitToSchool(schoolId, 'message:new', message);
    }

    return message;
  }

  async getMessages(user) {
    const schoolId = user.schoolId?._id || user.schoolId;

    if (user.role === 'super_admin' || user.role === 'school_admin') {
      return await Message.find({ schoolId }).sort({ createdAt: -1 });
    }

    if (user.role === 'teacher') {
      return await Message.find({
        schoolId,
        $or: [
          { senderId: user._id },
          { recipientId: user._id },
          { isAnnouncement: true },
          { recipientRole: { $in: ['teacher', 'all_school'] } },
        ],
      }).sort({ createdAt: -1 });
    }

    if (user.role === 'parent') {
      return await Message.find({
        schoolId,
        $or: [
          { senderId: user._id },
          { recipientId: user._id },
          { isAnnouncement: true },
          { recipientRole: { $in: ['parent', 'all_grade_parents', 'all_school'] } },
        ],
      }).sort({ createdAt: -1 });
    }

    if (user.role === 'student') {
      return await Message.find({
        schoolId,
        $or: [
          { isAnnouncement: true },
          { recipientRole: { $in: ['student', 'all_students', 'all_school'] } },
        ],
      }).sort({ createdAt: -1 });
    }

    return [];
  }

  async markAsRead(user, messageId) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');

    if (!message.readBy.includes(user._id)) {
      message.readBy.push(user._id);
      await message.save();
    }
    return message;
  }
}

module.exports = new MessageService();
