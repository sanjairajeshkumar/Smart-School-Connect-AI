const aiOrchestrator = require('./ai/aiOrchestrator');
const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const messageRepository = require('../repositories/messageRepository');

class AIService {
  async rewriteTeacherDraft({ draft, tone, audience, subject, preferredProvider }) {
    if (!draft || !draft.trim()) {
      throw new Error('Draft message is required for AI rewriting');
    }
    return await aiOrchestrator.rewriteMessageDraft({ draft, tone, audience, subject }, preferredProvider);
  }

  async generateStudentDigest({ studentId, preferredProvider }) {
    const student = await userRepository.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    const tasks = await taskRepository.findByStudent(student._id);
    const recentMessages = await messageRepository.getRecentTeacherUpdates(student.grade);

    return await aiOrchestrator.generateStudentDigest({
      studentName: student.name,
      grade: student.grade,
      tasks,
      recentMessages,
    }, preferredProvider);
  }

  async askAssistant({ query, user, preferredProvider }) {
    if (!query || !query.trim()) {
      throw new Error('Query cannot be empty');
    }

    let homeworkList = [];
    if (user.role === 'student') {
      homeworkList = await taskRepository.findByStudent(user._id);
    } else if (user.role === 'parent') {
      const children = await userRepository.findStudentsForParent(user._id);
      if (children.length > 0) {
        homeworkList = await taskRepository.findByStudent(children[0]._id);
      }
    } else if (user.role === 'teacher') {
      homeworkList = await taskRepository.findByTeacher(user._id);
    }

    return await aiOrchestrator.askSchoolAssistant({
      query,
      role: user.role,
      userName: user.name,
      studentData: user,
      homeworkList,
    }, preferredProvider);
  }
}

module.exports = new AIService();
