const User = require('../models/User');
const Task = require('../models/Task');
const TaskBatch = require('../models/TaskBatch');
const Message = require('../models/Message');

const seedInitialData = async () => {
  try {
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      console.log('Database already has records. Skipping initial seeding.');
      return;
    }

    console.log('Seeding initial data for Smart School Connect...');

    // 1. Create Teacher
    const teacher = await User.create({
      name: 'Ms. Taylor',
      email: 'teacher@school.com',
      password: 'password123',
      role: 'teacher',
      grade: 'Grade 8',
      section: 'A',
    });

    // 2. Create Parent
    const parent = await User.create({
      name: 'Sarah Johnson',
      email: 'parent.sarah@school.com',
      password: 'password123',
      role: 'parent',
      grade: 'Grade 8',
      phone: '+1 (555) 019-2834',
    });

    // 3. Create Student (Alex) linked to Parent & PIN 1234
    const student = await User.create({
      name: 'Alex Johnson',
      role: 'student',
      grade: 'Grade 8',
      section: 'A',
      pin: '1234',
      parentId: parent._id,
    });

    // Link student back to parent
    parent.childrenIds = [student._id];
    await parent.save();

    // 4. Create Initial Homework / Tasks (matching PDF screens)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const friday = new Date();
    friday.setDate(today.getDate() + 3);

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const task1 = await Task.create({
      title: 'Math - Fractions',
      subject: 'Mathematics',
      description: 'Complete practice worksheet problems 1 through 15 on fractional multiplications and denominators.',
      grade: 'Grade 8',
      teacherId: teacher._id,
      teacherName: teacher.name,
      assignedStudentId: student._id,
      assignedParentId: parent._id,
      dueDate: today,
      priority: 'high',
      status: 'pending',
      timeSpentMinutes: 0,
      isReleasedToStudent: true,
      batchSequence: 1,
    });

    const task2 = await Task.create({
      title: 'Science - Chapter 4',
      subject: 'Science',
      description: 'Read Chapter 4 on Cell Structure and answer the end-of-chapter review questions 1-5.',
      grade: 'Grade 8',
      teacherId: teacher._id,
      teacherName: teacher.name,
      assignedStudentId: student._id,
      assignedParentId: parent._id,
      dueDate: tomorrow,
      priority: 'medium',
      status: 'pending',
      timeSpentMinutes: 0,
      isReleasedToStudent: true,
      batchSequence: 2,
    });

    const task3 = await Task.create({
      title: 'English - Essay',
      subject: 'English',
      description: 'Draft a 300-word essay about your favorite historical figure and why their choices matter.',
      grade: 'Grade 8',
      teacherId: teacher._id,
      teacherName: teacher.name,
      assignedStudentId: student._id,
      assignedParentId: parent._id,
      dueDate: friday,
      priority: 'medium',
      status: 'pending',
      timeSpentMinutes: 0,
      isReleasedToStudent: false, // In batch 2 (locked until parent releases or batch 1 completes)
      batchSequence: 1,
    });

    const task4 = await Task.create({
      title: 'Science - Quiz Prep',
      subject: 'Science',
      description: 'Review notes on photosynthesis for the quick flash quiz.',
      grade: 'Grade 8',
      teacherId: teacher._id,
      teacherName: teacher.name,
      assignedStudentId: student._id,
      assignedParentId: parent._id,
      dueDate: yesterday,
      priority: 'low',
      status: 'completed',
      completedAt: yesterday,
      timeSpentMinutes: 30,
      studentNotes: 'Reviewed diagram and key terms. Feeling ready!',
      isReleasedToStudent: true,
      batchSequence: 3,
    });

    // 5. Create Parent Task Batches (Demonstrating Batching & Sequencing)
    const batch1 = await TaskBatch.create({
      title: 'Batch 1: Immediate Tasks (Today & Tomorrow)',
      parentId: parent._id,
      studentId: student._id,
      sequenceOrder: 1,
      taskIds: [task1._id, task2._id],
      isReleased: true,
      instructions: 'Complete these two first before starting your weekend essay.',
    });

    const batch2 = await TaskBatch.create({
      title: 'Batch 2: Weekend Projects & Essays',
      parentId: parent._id,
      studentId: student._id,
      sequenceOrder: 2,
      taskIds: [task3._id],
      isReleased: false,
      instructions: 'Release after Batch 1 is marked done.',
    });

    // Link batch IDs
    task1.parentBatchId = batch1._id;
    task1.batchName = batch1.title;
    await task1.save();

    task2.parentBatchId = batch1._id;
    task2.batchName = batch1.title;
    await task2.save();

    task3.parentBatchId = batch2._id;
    task3.batchName = batch2.title;
    await task3.save();

    // 6. Create Messages / Announcements
    await Message.create({
      senderId: teacher._id,
      senderRole: 'teacher',
      senderName: teacher.name,
      recipientRole: 'all_grade_parents',
      recipientId: null,
      recipientName: 'Grade 8 - Parents',
      grade: 'Grade 8',
      subject: 'Class Preparation Reminder',
      content: 'Bring your notebook tomorrow. We will be starting our interactive laboratory unit.',
      originalDraft: 'Bring notebook tomorrow for lab.',
      aiRewritten: true,
      aiModelUsed: 'Groq (Llama-3.3-70b)',
      teacherApproved: true,
      threadId: 'thread_grade8_welcome',
    });

    await Message.create({
      senderId: teacher._id,
      senderRole: 'teacher',
      senderName: teacher.name,
      recipientRole: 'parent',
      recipientId: parent._id,
      recipientName: parent.name,
      grade: 'Grade 8',
      subject: 'Math Worksheet Update',
      content: 'Please remind your child to complete the math worksheet by tomorrow.',
      originalDraft: 'Remind child about math worksheet tomorrow.',
      aiRewritten: true,
      aiModelUsed: 'Groq (Llama-3.3-70b)',
      teacherApproved: true,
      threadId: 'thread_sarah_johnson',
    });

    console.log('Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Test Accounts:');
    console.log('Teacher: teacher@school.com / password123');
    console.log('Parent:  parent.sarah@school.com / password123');
    console.log('Student: Alex Johnson (PIN: 1234)');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
};

module.exports = seedInitialData;
