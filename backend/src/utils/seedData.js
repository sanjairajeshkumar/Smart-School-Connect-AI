const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');

/**
 * Clean System Initializer
 * Seeds essential tenant structure and the default Superadmin account.
 * Eliminates all public self-registration vulnerabilities.
 */
const seedInitialData = async () => {
  try {
    console.log('[System Init] Checking multi-tenant SaaS foundation and default accounts...');

    // 1. Ensure primary showcase School Tenant exists
    let defaultSchool = await School.findOne({ slug: 'oakridge-academy' });
    if (!defaultSchool) {
      defaultSchool = await School.create({
        name: 'Oakridge International Academy',
        slug: 'oakridge-academy',
        domain: 'oakridge.edu',
        billingEmail: 'admin@oakridge.edu',
        address: '100 Academic Way, Metro City',
        phone: '+1 (555) 012-3456',
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
    }

    // 2. Ensure default academic classes exist
    const classCount = await Class.countDocuments({ schoolId: defaultSchool._id });
    if (classCount === 0) {
      await Class.create({
        schoolId: defaultSchool._id,
        name: 'Grade 8',
        section: 'A',
        academicYear: '2026-2027',
        roomNumber: 'Room 204',
        schedule: [
          { day: 'Monday', subject: 'Mathematics', startTime: '08:30', endTime: '09:30', teacherName: 'Lead Faculty' },
          { day: 'Monday', subject: 'Science', startTime: '09:45', endTime: '10:45', teacherName: 'Lead Faculty' },
          { day: 'Tuesday', subject: 'English Literature', startTime: '08:30', endTime: '09:30', teacherName: 'Lead Faculty' },
          { day: 'Wednesday', subject: 'Social Studies', startTime: '11:00', endTime: '12:00', teacherName: 'Lead Faculty' },
          { day: 'Thursday', subject: 'Computer Science', startTime: '13:00', endTime: '14:00', teacherName: 'Lead Faculty' },
          { day: 'Friday', subject: 'Physical Education', startTime: '10:00', endTime: '11:00', teacherName: 'Athletics Staff' },
        ],
      });

      await Class.create({
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

    // 3. Ensure Default Superadmin Account exists (mail: admin / password: admin123)
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
      console.log('----------------------------------------------------');
      console.log('✅ Default Superadmin Created Successfully:');
      console.log('   Username / Email: admin');
      console.log('   Password:         admin123');
      console.log('----------------------------------------------------');
    } else {
      console.log('[System Init] Superadmin account present (Login: admin)');
    }
  } catch (error) {
    console.error('[System Init] Error during database initialization:', error.message);
  }
};

module.exports = seedInitialData;
