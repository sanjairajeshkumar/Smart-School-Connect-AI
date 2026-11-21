import api from './api';

export const taskService = {
  async getTasks(params) {
    const res = await api.get('/tasks', { params });
    return res.data;
  },

  async createTask(taskData) {
    const res = await api.post('/tasks', taskData);
    return res.data;
  },

  async updateTask(id, updates) {
    const res = await api.put(`/tasks/${id}`, updates);
    return res.data;
  },

  async deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },

  async submitAssignment(id, submissionData) {
    const res = await api.post(`/tasks/${id}/submit`, submissionData);
    return res.data;
  },

  async getSubmissions(id) {
    const res = await api.get(`/tasks/${id}/submissions`);
    return res.data;
  },

  async gradeSubmission(submissionId, gradeData) {
    const res = await api.post(`/tasks/submissions/${submissionId}/grade`, gradeData);
    return res.data;
  },

  async createBatch(batchData) {
    const res = await api.post('/tasks/batches', batchData);
    return res.data;
  },

  async getBatches(studentId) {
    const res = await api.get('/tasks/batches', { params: { studentId } });
    return res.data;
  },

  async toggleBatchRelease(batchId, isReleased) {
    const res = await api.patch(`/tasks/batches/${batchId}/release`, { isReleased });
    return res.data;
  },
};
