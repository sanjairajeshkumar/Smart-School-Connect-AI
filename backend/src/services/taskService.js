const taskRepository = require('../repositories/taskRepository');
const taskBatchRepository = require('../repositories/taskBatchRepository');
const userRepository = require('../repositories/userRepository');

class TaskService {
  async createTask(teacherUser, data) {
    if (teacherUser.role !== 'teacher' && teacherUser.role !== 'staff') {
      throw new Error('Unauthorized: Only teachers or staff can create assignments');
    }

    const taskData = {
      title: data.title,
      subject: data.subject,
      description: data.description || '',
      grade: data.grade || teacherUser.grade || 'Grade 8',
      teacherId: teacherUser._id,
      teacherName: teacherUser.name,
      dueDate: new Date(data.dueDate),
      priority: data.priority || 'medium',
      assignedStudentId: data.assignedStudentId || null,
      assignedParentId: data.assignedParentId || null,
      isReleasedToStudent: true,
    };

    return await taskRepository.create(taskData);
  }

  async getTasksForUser(user, queryParams = {}) {
    const { status, subject, studentId } = queryParams;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (subject && subject !== 'all') filter.subject = subject;

    if (user.role === 'teacher' || user.role === 'staff') {
      if (studentId) {
        filter.assignedStudentId = studentId;
      }
      return await taskRepository.findByTeacher(user._id, filter);
    }

    if (user.role === 'parent') {
      // Find tasks for all linked children
      const children = await userRepository.findStudentsForParent(user._id);
      const childIds = children.map(c => c._id);
      
      const query = {
        $or: [
          { assignedStudentId: { $in: childIds } },
          { assignedStudentId: null, grade: { $in: children.map(c => c.grade) } }
        ],
        ...filter,
      };
      return await taskRepository.findByGrade(user.grade, query);
    }

    if (user.role === 'student') {
      // Student only sees released tasks or tasks assigned to them / their grade
      const studentTasks = await taskRepository.findByStudent(user._id, {
        isReleasedToStudent: true,
        ...filter,
      });
      return studentTasks;
    }

    return [];
  }

  async updateTaskStatus(user, taskId, updates) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Role verification
    if (user.role === 'student') {
      // Ensure this task belongs to this student or their grade
      if (task.assignedStudentId && task.assignedStudentId._id.toString() !== user._id.toString()) {
        throw new Error('Unauthorized to update this task');
      }
    }

    const updateFields = {};
    if (updates.status !== undefined) {
      updateFields.status = updates.status;
      if (updates.status === 'completed') {
        updateFields.completedAt = new Date();
      } else {
        updateFields.completedAt = null;
      }
    }
    if (updates.studentNotes !== undefined) {
      updateFields.studentNotes = updates.studentNotes;
    }
    if (updates.timeSpentMinutes !== undefined) {
      updateFields.timeSpentMinutes = Number(updates.timeSpentMinutes);
    }
    if (updates.title !== undefined && user.role !== 'student') {
      updateFields.title = updates.title;
    }
    if (updates.subject !== undefined && user.role !== 'student') {
      updateFields.subject = updates.subject;
    }
    if (updates.dueDate !== undefined && user.role !== 'student') {
      updateFields.dueDate = new Date(updates.dueDate);
    }
    if (updates.priority !== undefined && user.role !== 'student') {
      updateFields.priority = updates.priority;
    }

    return await taskRepository.update(taskId, updateFields);
  }

  async deleteTask(user, taskId) {
    if (user.role === 'student') {
      throw new Error('Students are not permitted to delete assignments');
    }
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return await taskRepository.delete(taskId);
  }

  /**
   * Parent Task Batching & Sequencing:
   * Splits or organizes child's tasks into sequential batches
   * (e.g. Batch 1: first 2 tasks released; Batch 2: released once Batch 1 is done)
   */
  async createOrUpdateBatch(parentUser, { studentId, title, taskIds, sequenceOrder, isReleased, instructions }) {
    if (parentUser.role !== 'parent') {
      throw new Error('Only parents can create or sequence task batches for their child');
    }

    const batch = await taskBatchRepository.create({
      title,
      parentId: parentUser._id,
      studentId,
      sequenceOrder: sequenceOrder || 1,
      taskIds,
      isReleased: isReleased !== undefined ? isReleased : true,
      instructions: instructions || '',
    });

    // Update tasks to link them to this batch
    for (let i = 0; i < taskIds.length; i++) {
      await taskRepository.update(taskIds[i], {
        parentBatchId: batch._id,
        batchName: title,
        batchSequence: i + 1,
        isReleasedToStudent: batch.isReleased,
      });
    }

    return await taskBatchRepository.findById(batch._id);
  }

  async getBatches(parentOrStudentUser, studentId) {
    const targetStudentId = parentOrStudentUser.role === 'student' ? parentOrStudentUser._id : studentId;
    const parentId = parentOrStudentUser.role === 'parent' ? parentOrStudentUser._id : parentOrStudentUser.parentId;
    
    return await taskBatchRepository.findByParentAndStudent(parentId, targetStudentId);
  }

  async toggleBatchRelease(parentUser, batchId, isReleased) {
    if (parentUser.role !== 'parent') {
      throw new Error('Only parents can toggle batch release');
    }

    const batch = await taskBatchRepository.findById(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    const updatedBatch = await taskBatchRepository.update(batchId, { isReleased });

    // Update all tasks in this batch to reflect release status to student
    for (const taskId of batch.taskIds) {
      await taskRepository.update(taskId._id || taskId, {
        isReleasedToStudent: isReleased,
      });
    }

    return updatedBatch;
  }
}

module.exports = new TaskService();
