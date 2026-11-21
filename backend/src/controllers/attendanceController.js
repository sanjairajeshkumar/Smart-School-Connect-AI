const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async getClassAttendance(req, res, next) {
    try {
      const { classId } = req.params;
      const { date } = req.query;
      const result = await attendanceService.getClassAttendance(req.schoolId, classId, date);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAttendance(req, res, next) {
    try {
      const result = await attendanceService.markClassAttendance(req.user, req.body);
      res.status(200).json({ success: true, data: result, message: 'Attendance marked and broadcasted in real-time!' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getStudentAttendance(req, res, next) {
    try {
      const studentId = req.params.studentId || req.user._id;
      const result = await attendanceService.getStudentAttendance(req.schoolId, studentId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
