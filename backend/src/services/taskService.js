const Task = require('../models/Task');
const TaskBatch = require('../models/TaskBatch');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Class = require('../models/Class');
const School = require('../models/School');
const Message = require('../models/Message');
const socketService = require('./socketService');
const emailService = require('./emailService');

class TaskService {
  async createTask(teacherUser, data) {
    if (teacherUser.role !== 'teacher' && teacherUser.role !== 'school_admin' && teacherUser.role !== 'staff') {
      throw new Error('Unauthorized: Only teachers or staff can create assignments');
    }

    const schoolId = teacherUser.schoolId?._id || teacherUser.schoolId;

    let taskClassId = data.classId || teacherUser.classId?._id || teacherUser.classId || null;
    let taskGrade = data.grade || teacherUser.grade || '9';
    let taskSection = data.section || teacherUser.section || 'B';

    if (taskClassId) {
      const cls = await Class.findById(taskClassId);
      if (cls) {
        taskGrade = cls.name;
        taskSection = cls.section;
      }
    }

    const taskData = {
      schoolId,
      classId: taskClassId,
      title: data.title,
      subject: data.subject,
      description: data.description || '',
      grade: taskGrade,
      section: taskSection,
      teacherId: teacherUser._id,
      teacherName: teacherUser.name,
      dueDate: new Date(data.dueDate),
      priority: data.priority || 'medium',
      maxScore: data.maxScore ? Number(data.maxScore) : 100,
      studyMaterials: data.studyMaterials || [],
      assignedStudentId: data.assignedStudentId || null,
      assignedParentId: data.assignedParentId || null,
      isReleasedToStudent: true,
    };

    const task = await Task.create(taskData);

    // Broadcast real-time assignment creation via WebSockets
    socketService.emitToSchool(schoolId, 'task:created', {
      taskId: task._id,
      title: task.title,
      subject: task.subject,
      dueDate: task.dueDate,
      teacherName: task.teacherName,
    });

    if (task.classId) {
      socketService.emitToClass(task.classId, 'task:created', task);
    }

    return task;
  }

  async getTasksForUser(user, queryParams = {}) {
    const schoolId = user.schoolId?._id || user.schoolId;
    const { status, subject, studentId, classId } = queryParams;
    const filter = { schoolId };

    if (status && status !== 'all') filter.status = status;
    if (subject && subject !== 'all') filter.subject = subject;
    if (classId) filter.classId = classId;

    if (user.role === 'teacher' || user.role === 'school_admin' || user.role === 'staff') {
      if (studentId) filter.assignedStudentId = studentId;
      if (user.role === 'teacher' && !classId) {
        filter.$or = [{ teacherId: user._id }, { classId: user.classId }];
      }
      return await Task.find(filter).sort({ dueDate: 1 }).populate('classId', 'name section');
    }

    if (user.role === 'parent') {
      // Find tasks for all linked children
      const children = await User.find({
        schoolId,
        _id: { $in: user.childrenIds || [] },
      });
      const childIds = children.map((c) => c._id);
      const childClassIds = children.map((c) => c.classId).filter(Boolean);

      const query = {
        schoolId,
        $or: [
          { assignedStudentId: { $in: childIds } },
          { classId: { $in: childClassIds } },
          { assignedStudentId: null },
        ],
        ...filter,
      };
      const tasks = await Task.find(query).sort({ dueDate: 1 }).populate('classId', 'name section');

      const taskIds = tasks.map((t) => t._id);
      const submissions = await Submission.find({ taskId: { $in: taskIds }, studentId: { $in: childIds } });
      const submissionMap = new Map();
      submissions.forEach((s) => submissionMap.set(s.taskId.toString(), s));

      return tasks.map((t) => {
        const obj = t.toObject();
        obj.submission = submissionMap.get(t._id.toString()) || null;
        return obj;
      });
    }

    if (user.role === 'student') {
      // Student sees tasks for their class or individually assigned to them
      const query = {
        schoolId,
        isReleasedToStudent: true,
        $or: [
          { assignedStudentId: user._id },
          { classId: user.classId },
          { assignedStudentId: null, grade: user.grade },
        ],
        ...filter,
      };
      
      const tasks = await Task.find(query).sort({ dueDate: 1 }).populate('classId', 'name section');
      
      // Attach student's own submission details to each task
      const taskIds = tasks.map((t) => t._id);
      const submissions = await Submission.find({ taskId: { $in: taskIds }, studentId: user._id });
      const submissionMap = new Map();
      submissions.forEach((s) => submissionMap.set(s.taskId.toString(), s));

      return tasks.map((t) => {
        const obj = t.toObject();
        obj.submission = submissionMap.get(t._id.toString()) || null;
        return obj;
      });
    }

    return [];
  }

  async updateTaskStatus(user, taskId, updates) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');

    if (user.role === 'student') {
      if (task.assignedStudentId && task.assignedStudentId.toString() !== user._id.toString()) {
        throw new Error('Unauthorized to update this task');
      }
    }

    const updateFields = {};
    if (updates.status !== undefined) {
      updateFields.status = updates.status;
      updateFields.completedAt = updates.status === 'completed' ? new Date() : null;
    }
    if (updates.studentNotes !== undefined) updateFields.studentNotes = updates.studentNotes;
    if (updates.timeSpentMinutes !== undefined) updateFields.timeSpentMinutes = Number(updates.timeSpentMinutes);
    if (updates.title !== undefined && user.role !== 'student') updateFields.title = updates.title;
    if (updates.subject !== undefined && user.role !== 'student') updateFields.subject = updates.subject;
    if (updates.dueDate !== undefined && user.role !== 'student') updateFields.dueDate = new Date(updates.dueDate);
    if (updates.priority !== undefined && user.role !== 'student') updateFields.priority = updates.priority;
    if (updates.maxScore !== undefined && user.role !== 'student') updateFields.maxScore = Number(updates.maxScore);

    return await Task.findByIdAndUpdate(taskId, updateFields, { new: true });
  }

  async deleteTask(user, taskId) {
    if (user.role === 'student') {
      throw new Error('Students are not permitted to delete assignments');
    }
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    await Task.findByIdAndDelete(taskId);
    await Submission.deleteMany({ taskId });
    return { success: true };
  }

  /**
   * Submit homework assignment (Student)
   */
  async submitAssignment(studentUser, taskId, { content, attachmentUrl, timeSpentMinutes }) {
    if (studentUser.role !== 'student') {
      throw new Error('Only students can submit assignment responses');
    }

    const task = await Task.findById(taskId);
    if (!task) throw new Error('Assignment not found');

    const schoolId = studentUser.schoolId?._id || studentUser.schoolId;

    let submission = await Submission.findOne({ taskId, studentId: studentUser._id });

    if (submission) {
      submission.content = content || submission.content;
      submission.attachmentUrl = attachmentUrl || submission.attachmentUrl;
      submission.timeSpentMinutes = timeSpentMinutes || submission.timeSpentMinutes;
      submission.status = 'submitted';
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = await Submission.create({
        schoolId,
        taskId,
        studentId: studentUser._id,
        studentName: studentUser.name,
        content: content || '',
        attachmentUrl: attachmentUrl || '',
        timeSpentMinutes: timeSpentMinutes || 0,
        status: 'submitted',
        maxScore: task.maxScore || 100,
        submittedAt: new Date(),
      });
    }

    // Mark task completed on student's record
    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    // Alert teacher in real-time
    socketService.emitToUser(task.teacherId, 'submission:received', {
      taskId: task._id,
      taskTitle: task.title,
      studentName: studentUser.name,
      studentId: studentUser._id,
      submissionId: submission._id,
    });

    return submission;
  }

  /**
   * Grade a student submission (Teacher)
   */
  async gradeSubmission(teacherUser, submissionId, { score, feedback }) {
    if (teacherUser.role !== 'teacher' && teacherUser.role !== 'school_admin') {
      throw new Error('Only teachers or school administrators can grade submissions');
    }

    const submission = await Submission.findById(submissionId).populate('taskId');
    if (!submission) throw new Error('Submission not found');

    submission.score = Number(score);
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedBy = teacherUser._id;
    submission.gradedAt = new Date();
    await submission.save();

    // Broadcast grade update in real-time to student and parent!
    const gradeData = {
      submissionId: submission._id,
      taskId: submission.taskId._id,
      taskTitle: submission.taskId.title,
      studentId: submission.studentId,
      score: submission.score,
      maxScore: submission.maxScore,
      feedback: submission.feedback,
      gradedByName: teacherUser.name,
      attachmentUrl: submission.attachmentUrl || null,
    };

    socketService.emitToUser(submission.studentId, 'grade:updated', gradeData);

    const student = await User.findById(submission.studentId).populate('parentId');
    
    // Notify Parent if linked
    if (student?.parentId) {
      const parentUser = student.parentId;
      socketService.emitToUser(parentUser._id, 'grade:updated', gradeData);

      // Create in-app message to parent
      try {
        await Message.create({
          schoolId: submission.schoolId,
          senderId: teacherUser._id,
          senderName: teacherUser.name,
          senderRole: 'teacher',
          recipientId: parentUser._id,
          recipientRole: 'parent',
          title: `Grade & Review: ${student.name} scored ${submission.score}/${submission.maxScore} on ${submission.taskId.title}`,
          content: `Hello ${parentUser.name},\n\nYour child ${student.name}'s homework for "${submission.taskId.title}" (${submission.taskId.subject}) has been evaluated.\n\nScore: ${submission.score} / ${submission.maxScore}\nTeacher Review: "${submission.feedback || 'Good work!'}"`,
          attachments: submission.attachmentUrl ? [{ name: 'homework_work.jpg', url: submission.attachmentUrl }] : [],
          targetGrade: student.grade || '9',
          isBroadcast: false,
        });
      } catch (msgErr) {
        console.warn('Failed to create in-app message for parent:', msgErr.message);
      }

      // Send Email to Parent
      if (parentUser.email) {
        try {
          await emailService.sendGradeReviewEmail({
            to: parentUser.email,
            recipientName: parentUser.name,
            studentName: student.name,
            taskTitle: submission.taskId.title,
            subject: submission.taskId.subject,
            score: submission.score,
            maxScore: submission.maxScore,
            feedback: submission.feedback,
            teacherName: teacherUser.name,
            attachmentUrl: submission.attachmentUrl,
          });
        } catch (emailErr) {
          console.warn('Failed to send grade email to parent:', emailErr.message);
        }
      }
    }

    // Send Email to Student if they have an email address
    if (student?.email) {
      try {
        await emailService.sendGradeReviewEmail({
          to: student.email,
          recipientName: student.name,
          studentName: student.name,
          taskTitle: submission.taskId.title,
          subject: submission.taskId.subject,
          score: submission.score,
          maxScore: submission.maxScore,
          feedback: submission.feedback,
          teacherName: teacherUser.name,
          attachmentUrl: submission.attachmentUrl,
        });
      } catch (err) {
        console.warn('Failed to email student grade:', err.message);
      }
    }

    return submission;
  }

  /**
   * Get all submissions for an assignment (Teacher view)
   */
  async getTaskSubmissions(taskId) {
    return await Submission.find({ taskId }).populate('studentId', 'name email grade section avatar');
  }

  /**
   * Parent Task Batching & Sequencing
   */
  async createOrUpdateBatch(parentUser, { studentId, title, taskIds, sequenceOrder, isReleased, instructions }) {
    if (parentUser.role !== 'parent') {
      throw new Error('Only parents can create or sequence task batches for their child');
    }

    const schoolId = parentUser.schoolId?._id || parentUser.schoolId;
    const effectiveStudentId = studentId || (parentUser.childrenIds?.[0]?._id || parentUser.childrenIds?.[0]);
    if (!effectiveStudentId) {
      throw new Error('No student linked to this parent account');
    }

    const batch = await TaskBatch.create({
      schoolId,
      title,
      parentId: parentUser._id,
      studentId: effectiveStudentId,
      sequenceOrder: sequenceOrder || 1,
      taskIds,
      isReleased: isReleased !== undefined ? isReleased : true,
      instructions: instructions || '',
    });

    for (let i = 0; i < taskIds.length; i++) {
      await Task.findByIdAndUpdate(taskIds[i], {
        parentBatchId: batch._id,
        batchName: title,
        batchSequence: i + 1,
        isReleasedToStudent: batch.isReleased,
      });
    }

    return await TaskBatch.findById(batch._id).populate('taskIds');
  }

  async getBatches(parentOrStudentUser, studentId) {
    const parentId = parentOrStudentUser.role === 'parent' ? parentOrStudentUser._id : parentOrStudentUser.parentId;
    const filter = {};
    if (parentId) filter.parentId = parentId;

    if (studentId) {
      filter.studentId = studentId;
    } else if (parentOrStudentUser.role === 'student') {
      filter.studentId = parentOrStudentUser._id;
    } else if (parentOrStudentUser.childrenIds && parentOrStudentUser.childrenIds.length > 0) {
      const childIds = parentOrStudentUser.childrenIds.map((c) => (c._id ? c._id : c));
      filter.studentId = { $in: childIds };
    }

    return await TaskBatch.find(filter).populate('taskIds');
  }

  async toggleBatchRelease(parentUser, batchId, isReleased) {
    if (parentUser.role !== 'parent') {
      throw new Error('Only parents can toggle batch release');
    }

    const batch = await TaskBatch.findById(batchId);
    if (!batch) throw new Error('Batch not found');

    batch.isReleased = isReleased;
    await batch.save();

    for (const taskId of batch.taskIds) {
      await Task.findByIdAndUpdate(taskId._id || taskId, {
        isReleasedToStudent: isReleased,
      });
    }

    return batch;
  }
}

module.exports = new TaskService();
