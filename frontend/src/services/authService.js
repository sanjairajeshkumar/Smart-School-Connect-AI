import api from './api';

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async studentPinLogin(pin, studentId = null) {
    const res = await api.post('/auth/student-pin', { pin, studentId });
    return res.data;
  },

  async getProfile() {
    const res = await api.get('/auth/profile');
    return res.data;
  },

  async getLinkedStudents() {
    const res = await api.get('/auth/students');
    return res.data;
  },
};
