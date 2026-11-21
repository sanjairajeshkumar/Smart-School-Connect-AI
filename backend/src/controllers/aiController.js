const aiService = require('../services/aiService');

class AIController {
  async rewriteDraft(req, res, next) {
    try {
      const { draft, tone, audience, subject, preferredProvider } = req.body;
      const result = await aiService.rewriteTeacherDraft({
        draft,
        tone,
        audience,
        subject,
        preferredProvider,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getStudentDigest(req, res, next) {
    try {
      const { studentId, preferredProvider } = req.body;
      const targetStudentId = studentId || (req.user.role === 'student' ? req.user._id : null);
      if (!targetStudentId) {
        return res.status(400).json({
          success: false,
          message: 'studentId is required to generate digest',
        });
      }
      const digest = await aiService.generateStudentDigest({
        studentId: targetStudentId,
        preferredProvider,
      });
      res.status(200).json({
        success: true,
        data: digest,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async askAssistant(req, res, next) {
    try {
      const { query, preferredProvider } = req.body;
      const answer = await aiService.askAssistant({
        query,
        user: req.user,
        preferredProvider,
      });
      res.status(200).json({
        success: true,
        data: answer,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AIController();
