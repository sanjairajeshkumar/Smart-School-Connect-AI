const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  async studentPinLogin(req, res, next) {
    try {
      const { pin, studentId } = req.body;
      const result = await authService.studentPinLogin(pin, studentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user._id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLinkedStudents(req, res, next) {
    try {
      if (req.user.role === 'parent') {
        const students = await userRepository.findStudentsForParent(req.user._id);
        return res.status(200).json({
          success: true,
          data: students,
        });
      }
      if (req.user.role === 'teacher' || req.user.role === 'staff') {
        const students = await userRepository.findByRole('student', req.user.grade);
        return res.status(200).json({
          success: true,
          data: students,
        });
      }
      res.status(200).json({
        success: true,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
