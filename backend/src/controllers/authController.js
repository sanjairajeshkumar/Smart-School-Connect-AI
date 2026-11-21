const authService = require('../services/authService');
const User = require('../models/User');

class AuthController {
  async registerSchool(req, res, next) {
    try {
      const result = await authService.registerSchool(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const result = await authService.verifyEmail(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async resendVerification(req, res, next) {
    try {
      const result = await authService.resendVerification(req.body.email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async login(req, res, next) {
    try {
      const { email, identifier, password } = req.body;
      const id = identifier || email;
      const result = await authService.login(id, password);
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

  async updateSuperAdminProfile(req, res, next) {
    try {
      const result = await authService.updateSuperAdminProfile(req.user._id, req.body);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Admin credentials updated successfully!',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInviteDetails(req, res, next) {
    try {
      const result = await authService.getInviteDetails(req.params.token);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async acceptInvite(req, res, next) {
    try {
      const result = await authService.acceptInvite(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
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
      const schoolFilter = req.schoolId ? { schoolId: req.schoolId } : {};

      if (req.user.role === 'parent') {
        const students = await User.find({
          ...schoolFilter,
          _id: { $in: req.user.childrenIds || [] },
        }).select('name email grade section avatar');

        return res.status(200).json({
          success: true,
          data: students,
        });
      }

      if (req.user.role === 'teacher' || req.user.role === 'school_admin' || req.user.role === 'super_admin' || req.user.role === 'staff') {
        const filter = {
          ...schoolFilter,
          role: 'student',
        };
        if (req.user.role === 'teacher' && req.user.classId) {
          filter.classId = req.user.classId;
        }

        const students = await User.find(filter).select('name email grade section parentId avatar');
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
