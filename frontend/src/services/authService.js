import api from './api';

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async registerSchool(data) {
    const res = await api.post('/auth/register-school', data);
    return res.data;
  },

  async verifyEmail({ email, otp, token }) {
    const res = await api.post('/auth/verify-email', { email, otp, token });
    return res.data;
  },

  async resendVerification(email) {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token, newPassword) {
    const res = await api.post('/auth/reset-password', { token, newPassword });
    return res.data;
  },

  async getInviteDetails(token) {
    const res = await api.get(`/auth/invite/${token}`);
    return res.data;
  },

  async acceptInvite(data) {
    const res = await api.post('/auth/accept-invite', data);
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

  async updateSuperAdminProfile(data) {
    const res = await api.put('/auth/superadmin/profile', data);
    return res.data;
  },
};
