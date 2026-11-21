const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return await User.findById(id).select('-password').populate('schoolId');
  }

  async findByIdWithPassword(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() }).populate('schoolId');
  }

  async findBySchoolAndRole(schoolId, role, grade = null) {
    const query = { schoolId, role };
    if (grade) query.grade = grade;
    return await User.find(query).select('-password');
  }

  async findStudentsForParent(schoolId, parentId) {
    return await User.find({ schoolId, parentId, role: 'student' }).select('-password');
  }

  async create(userData) {
    return await User.create(userData);
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
