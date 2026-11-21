import api from './api';

export const messageService = {
  async getMessages() {
    const res = await api.get('/messages');
    return res.data;
  },

  async sendMessage(data) {
    const res = await api.post('/messages', data);
    return res.data;
  },

  async getRecentUpdates(grade) {
    const res = await api.get('/messages/recent', { params: { grade } });
    return res.data;
  },
};
