const schoolService = require('../services/schoolService');

class SchoolController {
  async getProfile(req, res, next) {
    try {
      const school = await schoolService.getSchoolProfile(req.schoolId);
      res.status(200).json({ success: true, data: school });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updated = await schoolService.updateSchoolProfile(req.schoolId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const analytics = await schoolService.getSchoolAnalytics(req.schoolId);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  async getClasses(req, res, next) {
    try {
      const classes = await schoolService.getClasses(req.schoolId);
      res.status(200).json({ success: true, data: classes });
    } catch (error) {
      next(error);
    }
  }

  async getClassDetails(req, res, next) {
    try {
      const details = await schoolService.getClassDetails(req.schoolId, req.params.id);
      res.status(200).json({ success: true, data: details });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async createClass(req, res, next) {
    try {
      const newClass = await schoolService.createClass(req.schoolId, req.body);
      res.status(201).json({ success: true, data: newClass });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addScheduleItem(req, res, next) {
    try {
      const cls = await schoolService.addClassScheduleItem(req.schoolId, req.params.id, req.body);
      res.status(200).json({ success: true, data: cls });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async removeScheduleItem(req, res, next) {
    try {
      const cls = await schoolService.removeClassScheduleItem(req.schoolId, req.params.id, parseInt(req.params.index, 10));
      res.status(200).json({ success: true, data: cls });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async sendInvitation(req, res, next) {
    try {
      const result = await schoolService.sendInvitation(req.user, req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getInvitations(req, res, next) {
    try {
      const invitations = await schoolService.getInvitations(req.schoolId);
      res.status(200).json({ success: true, data: invitations });
    } catch (error) {
      next(error);
    }
  }

  async revokeInvitation(req, res, next) {
    try {
      const result = await schoolService.revokeInvitation(req.schoolId, req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await schoolService.getSchoolUsers(req.schoolId, req.query);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchoolController();
