const mongoose = require('mongoose');
const { ROLES, DEPARTMENTS } = require('../config/constants');

const profileSchema = new mongoose.Schema(
  {
    rollNo: { type: String, trim: true },
    department: { type: String, enum: DEPARTMENTS },
    year: { type: Number, min: 1, max: 5 },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'student' },
    profile: profileSchema,
    organizerOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 }, { name: 'user_role' });
userSchema.index({ 'profile.department': 1 }, { name: 'user_department' });

module.exports = mongoose.model('User', userSchema);
