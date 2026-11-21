const aiOrchestrator = require('./ai/aiOrchestrator');
const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const messageRepository = require('../repositories/messageRepository');
const Class = require('../models/Class');
const User = require('../models/User');
const School = require('../models/School');
const Task = require('../models/Task');

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

    const schoolId = user.schoolId?._id || user.schoolId;

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
    } else if (schoolId) {
      homeworkList = await Task.find({ schoolId }).limit(15).lean();
    }

    // Fetch live academic structure & tenant metadata so AI can answer questions about classes, students, and faculty
    let schoolStats = {};
    let classes = [];
    if (schoolId) {
      try {
        const [school, classDocs, totalStudents, totalTeachers, totalParents, teachersList] = await Promise.all([
          School.findById(schoolId).select('name currentAcademicYear').lean(),
          Class.find({ schoolId }).populate('homeroomTeacherId', 'name email').lean(),
          User.countDocuments({ schoolId, role: 'student' }),
          User.countDocuments({ schoolId, role: 'teacher' }),
          User.countDocuments({ schoolId, role: 'parent' }),
          User.find({ schoolId, role: 'teacher' }).select('name email grade section').lean(),
        ]);

        classes = classDocs || [];
        schoolStats = {
          schoolName: school?.name || 'Hogwarts',
          academicYear: school?.currentAcademicYear || '2026-2027',
          totalClasses: classDocs.length,
          totalStudents,
          totalTeachers,
          totalParents,
          teachers: (teachersList || []).map((t) => `${t.name} (${t.email})`),
        };
      } catch (err) {
        console.warn('[AIService] Error fetching school context for assistant:', err.message);
      }
    }

    return await aiOrchestrator.askSchoolAssistant({
      query,
      role: user.role,
      userName: user.name,
      studentData: user,
      homeworkList,
      schoolStats,
      classes,
    }, preferredProvider);
  }
}

module.exports = new AIService();
