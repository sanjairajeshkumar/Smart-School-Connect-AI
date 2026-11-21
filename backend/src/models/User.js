const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['teacher', 'parent', 'student', 'staff'],
      required: [true, 'Role is required'],
    },
    grade: {
      type: String,
      default: 'Grade 8',
    },
    section: {
      type: String,
      default: 'A',
    },
    // Student 4-digit PIN for quick student login flow
    pin: {
      type: String,
      trim: true,
    },
    // Links between parent and students
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    childrenIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare student PIN helper
userSchema.methods.matchPin = function (enteredPin) {
  if (!this.pin) return false;
  return this.pin === enteredPin.trim();
};

module.exports = mongoose.model('User', userSchema);
