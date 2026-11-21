const Attendance = require('../models/Attendance');
const User = require('../models/User');
const socketService = require('./socketService');
const emailService = require('./emailService');

class AttendanceService {
  /**
   * Get attendance for a class on a specific date
   */
  async getClassAttendance(schoolId, classId, dateStr) {
    const date = dateStr || new Date().toISOString().split('T')[0];
    let attendance = await Attendance.findOne({ schoolId, classId, date }).populate('markedBy', 'name');

    // If no attendance sheet exists yet for this date, build one pre-populated with class students
    if (!attendance) {
      const students = await User.find({ schoolId, classId, role: 'student' }).select('name email');
      const records = students.map((s) => ({
        studentId: s._id,
        studentName: s.name,
        status: 'present',
        remarks: '',
      }));

      return {
        isNew: true,
        schoolId,
        classId,
        date,
        records,
        markedBy: null,
      };
    }

    return attendance;
  }

  /**
   * Mark or update daily attendance and broadcast in real-time
   */
  async markClassAttendance(teacherUser, { classId, date, records }) {
    if (!classId || !records || !Array.isArray(records)) {
      throw new Error('Class ID and attendance records array are required');
    }

    const dateStr = date || new Date().toISOString().split('T')[0];
    const schoolId = teacherUser.schoolId?._id || teacherUser.schoolId;

    let attendance = await Attendance.findOne({ schoolId, classId, date: dateStr });

    if (attendance) {
      attendance.records = records;
      attendance.markedBy = teacherUser._id;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        schoolId,
        classId,
        date: dateStr,
        records,
        markedBy: teacherUser._id,
      });
    }

    // 1. Broadcast real-time event to school and class via WebSockets
    socketService.emitToSchool(schoolId, 'attendance:updated', {
      classId,
      date: dateStr,
      markedByName: teacherUser.name,
      recordsCount: records.length,
      timestamp: new Date().toISOString(),
    });

    socketService.emitToClass(classId, 'attendance:updated', {
      classId,
      date: dateStr,
      records,
    });

    // 2. Alert parents of absent students asynchronously
    for (const rec of records) {
      if (rec.status === 'absent') {
        const student = await User.findById(rec.studentId).populate('parentId');
        if (student && student.parentId?.email) {
          emailService.sendAttendanceAlertEmail({
            to: student.parentId.email,
            parentName: student.parentId.name,
            studentName: student.name,
            date: dateStr,
            status: rec.status,
            remarks: rec.remarks,
          }).catch((err) => console.warn('Attendance alert email error:', err.message));
        }
      }
    }

    return attendance;
  }

  /**
   * Get student's attendance summary and history
   */
  async getStudentAttendance(schoolId, studentId) {
    const records = await Attendance.find({
      schoolId,
      'records.studentId': studentId,
    }).sort({ date: -1 }).limit(30);

    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;
    const history = [];

    for (const att of records) {
      const studentRecord = att.records.find((r) => r.studentId.toString() === studentId.toString());
      if (studentRecord) {
        total++;
        if (studentRecord.status === 'present') present++;
        else if (studentRecord.status === 'absent') absent++;
        else if (studentRecord.status === 'late') {
          late++;
          present++; // count partial attendance
        }

        history.push({
          date: att.date,
          status: studentRecord.status,
          remarks: studentRecord.remarks,
        });
      }
    }

    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    return {
      studentId,
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      attendancePercentage: percentage,
      recentLogs: history,
    };
  }
}

module.exports = new AttendanceService();
