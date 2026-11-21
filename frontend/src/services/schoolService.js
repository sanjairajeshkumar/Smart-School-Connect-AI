import api from './api';

export const schoolService = {
  async getProfile() {
    const res = await api.get('/school/profile');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/school/profile', data);
    return res.data;
  },

  async getAnalytics() {
    const res = await api.get('/school/analytics');
    return res.data;
  },

  async getClasses() {
    const res = await api.get('/school/classes');
    return res.data;
  },

  async getClassDetails(classId) {
    const res = await api.get(`/school/classes/${classId}`);
    return res.data;
  },

  async createClass(data) {
    const res = await api.post('/school/classes', data);
    return res.data;
  },

  async getUsers(params) {
    const res = await api.get('/school/users', { params });
    return res.data;
  },

  async getInvitations() {
    const res = await api.get('/school/invitations');
    return res.data;
  },

  async sendInvitation(data) {
    const res = await api.post('/school/invitations', data);
    return res.data;
  },

  async revokeInvitation(id) {
    const res = await api.delete(`/school/invitations/${id}`);
    return res.data;
  },
};
