const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async findByIdWithPassword(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findByPinAndParent(pin, parentEmailOrId) {
    const query = { pin: pin.trim(), role: 'student' };
    if (parentEmailOrId) {
      query.$or = [{ parentId: parentEmailOrId }, { email: parentEmailOrId }];
    }
    return await User.findOne(query);
  }

  async findStudentByPin(pin, studentId = null) {
    const query = { pin: pin.trim(), role: 'student' };
    if (studentId) {
      query._id = studentId;
    }
    return await User.findOne(query).populate('parentId', 'name email phone');
  }

  async findByRole(role, grade = null) {
    const query = { role };
    if (grade) query.grade = grade;
    return await User.find(query).select('-password');
  }

  async findStudentsForParent(parentId) {
    return await User.find({ parentId, role: 'student' }).select('-password');
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
