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

    // 2. Ensure Default Superadmin Account exists (mail: admin / password: admin123 or 12345678)
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

    console.log('----------------------------------------------------');
    console.log('📋 SUPER ADMINISTRATOR CREDENTIALS:');
    console.log('   Admin:   admin              (Pass: admin123 or 12345678)');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('[System Init] Error during database initialization:', error.message);
  }
};

module.exports = seedInitialData;
