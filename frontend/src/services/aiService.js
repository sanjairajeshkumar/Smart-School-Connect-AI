import api from './api';

export const aiService = {
  async rewriteDraft({ draft, tone, audience, subject, preferredProvider }) {
    const res = await api.post('/ai/rewrite-draft', {
      draft,
      tone,
      audience,
      subject,
      preferredProvider,
    });
    return res.data;
  },

  async getStudentDigest(studentId, preferredProvider) {
    const res = await api.post('/ai/student-digest', {
      studentId,
      preferredProvider,
    });
    return res.data;
  },

  async askAssistant(query, preferredProvider) {
    const res = await api.post('/ai/assistant', {
      query,
      preferredProvider,
    });
    return res.data;
  },
};
