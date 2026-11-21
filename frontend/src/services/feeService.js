import api from './api';

export const feeService = {
  async getInvoices(params) {
    const res = await api.get('/fees', { params });
    return res.data;
  },

  async createInvoice(data) {
    const res = await api.post('/fees', data);
    return res.data;
  },

  async payInvoice(id, data = {}) {
    const res = await api.post(`/fees/${id}/pay`, data);
    return res.data;
  },
};
