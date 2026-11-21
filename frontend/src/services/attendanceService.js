import api from './api';

export const attendanceService = {
  async getClassAttendance(classId, date) {
    const res = await api.get(`/attendance/class/${classId}`, { params: { date } });
    return res.data;
  },

  async markAttendance(data) {
    const res = await api.post('/attendance/mark', data);
    return res.data;
  },

  async getStudentAttendance(studentId) {
    const res = await api.get(`/attendance/student/${studentId || 'me'}`);
    return res.data;
  },
};
