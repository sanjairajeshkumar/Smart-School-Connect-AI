const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userRepository = require('../repositories/userRepository');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        grade: user.grade,
        parentId: user.parentId,
        childrenIds: user.childrenIds,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Please provide email and password');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const populated = await userRepository.findById(user._id);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        section: user.section,
        pin: user.pin,
        parentId: user.parentId,
        childrenIds: user.childrenIds,
      },
    };
  }

  async studentPinLogin(pin, studentId = null) {
    if (!pin) {
      throw new Error('Please enter your 4-digit student PIN');
    }

    const student = await userRepository.findStudentByPin(pin, studentId);
    if (!student) {
      throw new Error('Invalid student PIN. Please check with your teacher or parent.');
    }

    const token = this.generateToken(student);

    return {
      token,
      user: {
        id: student._id,
        name: student.name,
        role: student.role,
        grade: student.grade,
        section: student.section,
        pin: student.pin,
        parentId: student.parentId,
      },
    };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = new AuthService();
