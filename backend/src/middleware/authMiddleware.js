const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).populate('schoolId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session not found or account no longer exists.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact your school administrator.',
      });
    }

    req.user = user;
    req.schoolId = user.schoolId?._id || user.schoolId || null;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please sign in again.',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
