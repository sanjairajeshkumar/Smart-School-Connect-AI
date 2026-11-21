const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');

/**
 * Clean System Initializer
 * Seeds essential tenant structure, default Superadmin account,
 * and sample test users (Teacher, Student, Parent with password: 12345678).
 */
const seedInitialData = async () => {
  try {
    console.log('[System Init] Checking multi-tenant SaaS foundation and default accounts...');

    // 1. Ensure primary showcase School Tenant exists
    let defaultSchool = await School.findOne({ $or: [{ slug: 'hogwarts' }, { slug: 'oakridge-academy' }] });
    if (!defaultSchool) {
      defaultSchool = await School.create({
        name: 'Hogwarts',
        slug: 'hogwarts',
        domain: 'hogwarts.edu',
        billingEmail: 'headmaster@hogwarts.edu',
        address: 'Hogwarts Castle, Highlands, Scotland',
        phone: '+44 (1632) 960001',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        seatsLimit: 500,
        currentAcademicYear: '2026-2027',
        settings: {
          currency: 'USD',
          allowParentMessaging: true,
          autoSendAttendanceAlerts: true,
        },
      });
      console.log(`[System Init] Created primary school tenant: ${defaultSchool.name}`);
    } else {
      defaultSchool.name = 'Hogwarts';
      defaultSchool.slug = 'hogwarts';
      defaultSchool.domain = 'hogwarts.edu';
      defaultSchool.billingEmail = 'headmaster@hogwarts.edu';
      await defaultSchool.save();
    }

    // 2. Ensure default academic classes exist
    let grade8Class = await Class.findOne({ schoolId: defaultSchool._id, name: 'Grade 8', section: 'A' });
    if (!grade8Class) {
      grade8Class = await Class.create({
        schoolId: defaultSchool._id,
        name: 'Grade 8',
        section: 'A',
        academicYear: '2026-2027',
        roomNumber: 'Room 204',
        schedule: [
          { day: 'Monday', subject: 'Mathematics', startTime: '08:30', endTime: '09:30', teacherName: 'Ms. Taylor' },
          { day: 'Monday', subject: 'Science', startTime: '09:45', endTime: '10:45', teacherName: 'Ms. Taylor' },
          { day: 'Tuesday', subject: 'English Literature', startTime: '08:30', endTime: '09:30', teacherName: 'Ms. Taylor' },
          { day: 'Wednesday', subject: 'Social Studies', startTime: '11:00', endTime: '12:00', teacherName: 'Lead Faculty' },
          { day: 'Thursday', subject: 'Computer Science', startTime: '13:00', endTime: '14:00', teacherName: 'Lead Faculty' },
          { day: 'Friday', subject: 'Physical Education', startTime: '10:00', endTime: '11:00', teacherName: 'Athletics Staff' },
        ],
      });
    }

    let grade9Class = await Class.findOne({ schoolId: defaultSchool._id, name: 'Grade 9', section: 'A' });
    if (!grade9Class) {
      grade9Class = await Class.create({
        schoolId: defaultSchool._id,
        name: 'Grade 9',
        section: 'A',
        academicYear: '2026-2027',
        roomNumber: 'Room 302',
        schedule: [
          { day: 'Monday', subject: 'Advanced Algebra', startTime: '09:00', endTime: '10:00', teacherName: 'Lead Faculty' },
          { day: 'Tuesday', subject: 'Physics', startTime: '10:15', endTime: '11:15', teacherName: 'Lead Faculty' },
        ],
      });
    }

    // 3. Ensure Default Superadmin Account exists (mail: admin / password: admin123 or 12345678)
    let superAdmin = await User.findOne({ email: 'admin' });
    if (!superAdmin) {
      superAdmin = await User.create({
        schoolId: defaultSchool._id,
        name: 'Super Administrator',
        email: 'admin',
        password: 'admin123',
        role: 'super_admin',
        status: 'active',
        isEmailVerified: true,
        grade: 'All',
        section: 'All',
      });
      console.log('✅ Default Superadmin Created (Login: admin / password: admin123 or 12345678)');
    }

    // 4. Sample Teacher Account (teacher@school.com / 12345678)
    let teacher = await User.findOne({ email: 'teacher@school.com' });
    if (!teacher) {
      teacher = await User.create({
        schoolId: defaultSchool._id,
        name: 'Ms. Taylor',
        email: 'teacher@school.com',
        password: '12345678',
        role: 'teacher',
        status: 'active',
        isEmailVerified: true,
        classId: grade8Class._id,
        grade: 'Grade 8',
        section: 'A',
      });
      console.log('✅ Sample Teacher Created: teacher@school.com / 12345678');
    } else {
      teacher.password = '12345678';
      teacher.status = 'active';
      teacher.isEmailVerified = true;
      teacher.classId = grade8Class._id;
      await teacher.save();
    }

    // Link homeroom teacher to Grade 8 class
    if (grade8Class && (!grade8Class.homeroomTeacherId || grade8Class.homeroomTeacherId.toString() !== teacher._id.toString())) {
      grade8Class.homeroomTeacherId = teacher._id;
      await grade8Class.save();
    }

    // 5. Sample Student Account (student@school.com / 12345678)
    let student = await User.findOne({ email: 'student@school.com' });
    if (!student) {
      student = await User.create({
        schoolId: defaultSchool._id,
        name: 'Alex Parker',
        email: 'student@school.com',
        password: '12345678',
        role: 'student',
        status: 'active',
        isEmailVerified: true,
        classId: grade8Class._id,
        grade: 'Grade 8',
        section: 'A',
      });
      console.log('✅ Sample Student Created: student@school.com / 12345678');
    } else {
      student.password = '12345678';
      student.status = 'active';
      student.isEmailVerified = true;
      student.classId = grade8Class._id;
      await student.save();
    }

    // 6. Sample Parent Account (parent@school.com / 12345678)
    let parent = await User.findOne({ email: 'parent@school.com' });
    if (!parent) {
      parent = await User.create({
        schoolId: defaultSchool._id,
        name: 'David Parker (Parent)',
        email: 'parent@school.com',
        password: '12345678',
        role: 'parent',
        status: 'active',
        isEmailVerified: true,
        childrenIds: [student._id],
      });
      console.log('✅ Sample Parent Created: parent@school.com / 12345678');
    } else {
      parent.password = '12345678';
      parent.status = 'active';
      parent.isEmailVerified = true;
      if (!parent.childrenIds || !parent.childrenIds.some((id) => id.toString() === student._id.toString())) {
        parent.childrenIds = [student._id];
      }
      await parent.save();
    }

    // Link student parentId
    if (student && (!student.parentId || student.parentId.toString() !== parent._id.toString())) {
      student.parentId = parent._id;
      await student.save();
    }

    console.log('----------------------------------------------------');
    console.log('📋 SAMPLE TEST CREDENTIALS (PASSWORD: 12345678):');
    console.log('   Admin:   admin              (Pass: 12345678 or admin123)');
    console.log('   Teacher: teacher@school.com (Pass: 12345678)');
    console.log('   Student: student@school.com (Pass: 12345678)');
    console.log('   Parent:  parent@school.com  (Pass: 12345678)');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('[System Init] Error during database initialization:', error.message);
  }
};

module.exports = seedInitialData;
