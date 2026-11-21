const messageRepository = require('../repositories/messageRepository');
const userRepository = require('../repositories/userRepository');

class MessageService {
  async sendMessage(senderUser, data) {
    const { recipientId, recipientRole, subject, content, originalDraft, aiRewritten, aiModelUsed, threadId, grade } = data;

    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    let targetGrade = grade || senderUser.grade || 'Grade 8';
    let recipientName = 'All Grade Parents';

    if (recipientId) {
      const recipient = await userRepository.findById(recipientId);
      if (recipient) {
        recipientName = recipient.name;
        targetGrade = recipient.grade || targetGrade;
      }
    }

    const messageData = {
      senderId: senderUser._id,
      senderRole: senderUser.role,
      senderName: senderUser.name,
      recipientRole: recipientRole || (senderUser.role === 'teacher' ? 'all_grade_parents' : 'teacher'),
      recipientId: recipientId || null,
      recipientName,
      grade: targetGrade,
      subject: subject || 'School Communication',
      content: content.trim(),
      originalDraft: originalDraft || '',
      aiRewritten: !!aiRewritten,
      aiModelUsed: aiModelUsed || '',
      // Mandatory review flag enforced: explicit send means approved
      teacherApproved: true,
      threadId: threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isRead: false,
    };

    return await messageRepository.create(messageData);
  }

  async getMessages(user) {
    return await messageRepository.findForUser(user._id, user.role, user.grade);
  }

  async getRecentTeacherUpdates(grade = 'Grade 8') {
    return await messageRepository.getRecentTeacherUpdates(grade);
  }
}

module.exports = new MessageService();
