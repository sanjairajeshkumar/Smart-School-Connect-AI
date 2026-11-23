const crypto = require('crypto');
const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const FeeInvoice = require('../models/FeeInvoice');
const Attendance = require('../models/Attendance');
const emailService = require('./emailService');

class SchoolService {
  /**
   * Get School profile
   */
  async getSchoolProfile(schoolId) {
    const school = await School.findById(schoolId);
    if (!school) throw new Error('School tenant not found');
    return school;
  }

  /**
   * Update School profile
   */
  async updateSchoolProfile(schoolId, updateData) {
    const allowed = ['name', 'domain', 'address', 'phone', 'billingEmail', 'currentAcademicYear', 'logo', 'settings'];
    const filtered = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) filtered[key] = updateData[key];
    }

    const school = await School.findByIdAndUpdate(schoolId, filtered, { new: true });
    return school;
  }

  /**
   * Get Tenant Dashboard Analytics & KPI Metrics
   */
  async getSchoolAnalytics(schoolId) {
    const [
      studentsCount,
      teachersCount,
      parentsCount,
      classesCount,
      school,
      todayAttendance,
      feeInvoices,
    ] = await Promise.all([
      User.countDocuments({ schoolId, role: 'student' }),
      User.countDocuments({ schoolId, role: 'teacher' }),
      User.countDocuments({ schoolId, role: 'parent' }),
      Class.countDocuments({ schoolId }),
      School.findById(schoolId),
      Attendance.find({ schoolId, date: new Date().toISOString().split('T')[0] }),
      FeeInvoice.find({ schoolId }),
    ]);

    // Calculate attendance percentage for today
    let totalAttendanceRecords = 0;
    let presentCount = 0;
    for (const att of todayAttendance) {
      for (const rec of att.records) {
        totalAttendanceRecords++;
        if (rec.status === 'present' || rec.status === 'late') {
          presentCount++;
        }
      }
    }
    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 96; // Healthy baseline if not marked yet today

    // Calculate fee analytics
    let totalBilled = 0;
    let totalCollected = 0;
    let pendingInvoices = 0;
    for (const inv of feeInvoices) {
      totalBilled += inv.amount;
      if (inv.status === 'paid') {
        totalCollected += inv.amount;
      } else {
        pendingInvoices++;
      }
    }

    return {
      studentsCount,
      teachersCount,
      parentsCount,
      classesCount,
      totalUsers: studentsCount + teachersCount + parentsCount,
      seatsLimit: school?.seatsLimit || 500,
      seatsUsedPercentage: Math.min(100, Math.round(((studentsCount + teachersCount) / (school?.seatsLimit || 500)) * 100)),
      attendanceRate,
      subscriptionPlan: school?.subscriptionPlan || 'pro',
      subscriptionStatus: school?.subscriptionStatus || 'active',
      academicYear: school?.currentAcademicYear || '2026-2027',
      financials: {
        totalBilled,
        totalCollected,
        pendingAmount: totalBilled - totalCollected,
        pendingInvoices,
        collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
      },
    };
  }

  /**
   * Create Academic Class
   */
  async createClass(schoolId, { name, section, academicYear, roomNumber, homeroomTeacherId }) {
    if (!name) throw new Error('Class name is required (e.g. Grade 8)');
    const sec = (section || 'A').toUpperCase();

    const existing = await Class.findOne({ schoolId, name: name.trim(), section: sec });
    if (existing) {
      throw new Error(`Class ${name} - Section ${sec} already exists in this school.`);
    }

    const newClass = await Class.create({
      schoolId,
      name: name.trim(),
      section: sec,
      academicYear: academicYear || '2026-2027',
      roomNumber: roomNumber || 'Room 101',
      homeroomTeacherId: homeroomTeacherId || null,
      schedule: Array.isArray(schedule) ? schedule : [],
    });

    return newClass;
  }

  /**
   * Add a custom timetable period to a class schedule
   */
  async addClassScheduleItem(schoolId, classId, { day, subject, startTime, endTime, teacherName }) {
    const cls = await Class.findOne({ _id: classId, schoolId });
    if (!cls) throw new Error('Class not found');
    if (!day || !subject) throw new Error('Day and Subject are required for schedule');

    cls.schedule.push({
      day,
      subject: subject.trim(),
      startTime: startTime || '09:00',
      endTime: endTime || '10:00',
      teacherName: teacherName?.trim() || 'Lead Faculty',
    });
    await cls.save();
    return cls;
  }

  /**
   * Remove a timetable period from a class schedule
   */
  async removeClassScheduleItem(schoolId, classId, scheduleIndex) {
    const cls = await Class.findOne({ _id: classId, schoolId });
    if (!cls) throw new Error('Class not found');
    if (cls.schedule && scheduleIndex >= 0 && scheduleIndex < cls.schedule.length) {
      cls.schedule.splice(scheduleIndex, 1);
      await cls.save();
    }
    return cls;
  }

  /**
   * Get Classes for School with student counts
   */
  async getClasses(schoolId) {
    const classes = await Class.find({ schoolId }).populate('homeroomTeacherId', 'name email');
    
    // Attach enrolled student counts
    const enriched = await Promise.all(
      classes.map(async (c) => {
        const studentCount = await User.countDocuments({ schoolId, classId: c._id, role: 'student' });
        return {
          ...c.toObject(),
          studentCount,
        };
      })
    );

    return enriched;
  }

  /**
   * Get Full Class Details with Enrolled Students and Teachers
   */
  async getClassDetails(schoolId, classId) {
    const cls = await Class.findOne({ _id: classId, schoolId }).populate('homeroomTeacherId', 'name email phone avatar');
    if (!cls) throw new Error('Class not found');

    const students = await User.find({ schoolId, classId, role: 'student' })
      .select('name email status grade section phone avatar parentId createdAt')
      .populate('parentId', 'name email phone');

    const teachers = await User.find({ schoolId, classId, role: 'teacher' })
      .select('name email status grade section phone avatar createdAt');

    // If homeroom teacher is set but not in class teachers list, add them
    if (cls.homeroomTeacherId && !teachers.some((t) => t._id.toString() === cls.homeroomTeacherId._id.toString())) {
      teachers.unshift(cls.homeroomTeacherId);
    }

    return {
      class: cls,
      students,
      teachers,
      totalStudents: students.length,
      totalTeachers: teachers.length,
    };
  }

  /**
   * Send Role-Based Email Invitation (Teacher, Parent, Student, Staff)
   */
  async sendInvitation(inviterUser, { email, name, role, classId, studentId }) {
    if (!email || !role || !name) {
      throw new Error('Email, name, and role are required for invitation');
    }

    const cleanEmail = email.trim().toLowerCase();
    const school = await School.findById(inviterUser.schoolId);
    if (!school) throw new Error('School not found');

    // Check if user already exists in this school
    const existingUser = await User.findOne({ schoolId: school._id, email: cleanEmail });
    if (existingUser && existingUser.status === 'active') {
      throw new Error(`A user with email ${cleanEmail} is already active in ${school.name}`);
    }

    // Generate unique invitation token (7 days expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Revoke previous pending invites for this email in this school
    await Invitation.deleteMany({ schoolId: school._id, email: cleanEmail, status: 'pending' });

    const invitation = await Invitation.create({
      schoolId: school._id,
      email: cleanEmail,
      name: name.trim(),
      role,
      classId: classId || null,
      studentId: studentId || null,
      token,
      invitedBy: inviterUser._id,
      status: 'pending',
      expiresAt,
    });

    // Dispatch email (resilient so firewall/SMTP delays never freeze the admin UI)
    let emailResult = { success: false };
    try {
      emailResult = await emailService.sendInvitationEmail({
        to: cleanEmail,
        name: name.trim(),
        role,
        schoolName: school.name,
        token,
        invitedByName: inviterUser.name,
      });
    } catch (mailErr) {
      console.warn(`[Invitation] Email dispatch caught for ${cleanEmail}:`, mailErr.message);
    }

    return {
      success: true,
      message: emailResult?.success
        ? `Invitation successfully emailed to ${cleanEmail}`
        : `Invitation created for ${cleanEmail}! Activation link is ready.`,
      invitationId: invitation._id,
      token: invitation.token,
      emailSent: !!emailResult?.success,
    };
  }

  /**
   * Get all invitations for the school tenant
   */
  async getInvitations(schoolId) {
    return await Invitation.find({ schoolId })
      .populate('classId', 'name section')
      .populate('studentId', 'name email grade')
      .populate('invitedBy', 'name role')
      .sort({ createdAt: -1 });
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(schoolId, invitationId) {
    const invite = await Invitation.findOne({ _id: invitationId, schoolId });
    if (!invite) throw new Error('Invitation not found');
    invite.status = 'revoked';
    await invite.save();
    return { success: true, message: 'Invitation revoked' };
  }

  /**
   * Get tenant users with filters
   */
  async getSchoolUsers(schoolId, { role, classId }) {
    const filter = { schoolId };
    if (role) filter.role = role;
    if (classId) filter.classId = classId;

    return await User.find(filter)
      .select('name email role status grade section phone createdAt classId childrenIds parentId avatar')
      .populate('classId', 'name section')
      .populate({
        path: 'childrenIds',
        select: 'name grade section classId',
        populate: { path: 'classId', select: 'name section' },
      })
      .populate('parentId', 'name email phone')
      .sort({ createdAt: -1 });
  }

  /**
   * Remove member / Kick out from school and class (Superadmin / School admin)
   */
  async removeSchoolMember(schoolId, userId) {
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) {
      throw new Error('User not found in this school');
    }

    if (user.role === 'super_admin' || user.email === 'admin') {
      throw new Error('Super Administrator account is protected and cannot be removed');
    }

    // 1. If teacher, unassign from homeroom of any class
    if (user.role === 'teacher') {
      await Class.updateMany(
        { schoolId, homeroomTeacherId: user._id },
        { $unset: { homeroomTeacherId: 1 } }
      );
    }

    // 2. If student, unlink from parent
    if (user.role === 'student' && user.parentId) {
      await User.findByIdAndUpdate(user.parentId, {
        $pull: { childrenIds: user._id },
      });
    }

    // 3. If parent, clear parent link on children
    if (user.role === 'parent' && user.childrenIds && user.childrenIds.length > 0) {
      await User.updateMany(
        { _id: { $in: user.childrenIds } },
        { $unset: { parentId: 1 } }
      );
    }

    // 4. Revoke or remove any pending invitations for this user's email
    await Invitation.deleteMany({ schoolId, email: user.email.toLowerCase() });

    // 5. Delete the user
    await User.findByIdAndDelete(userId);

    return {
      success: true,
      message: `${user.name} (${user.role}) has been kicked out and removed from the school.`,
    };
  }

  /**
   * Unenroll student from a specific class
   */
  async unenrollStudentFromClass(schoolId, classId, studentId) {
    const user = await User.findOne({ _id: studentId, schoolId });
    if (!user) throw new Error('Student not found');
    user.classId = null;
    user.grade = '';
    user.section = '';
    await user.save();
    return { success: true, message: `${user.name} has been removed from this class.` };
  }

  /**
   * Unassign teacher from class
   */
  async unassignTeacherFromClass(schoolId, classId, teacherId) {
    const classObj = await Class.findOne({ _id: classId, schoolId });
    if (!classObj) throw new Error('Class not found');
    if (classObj.homeroomTeacherId && classObj.homeroomTeacherId.toString() === teacherId.toString()) {
      classObj.homeroomTeacherId = null;
      await classObj.save();
    }
    await User.findOneAndUpdate({ _id: teacherId, schoolId }, { $set: { classId: null } });
    return { success: true, message: 'Teacher unassigned from class.' };
  }
}

module.exports = new SchoolService();
