const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { validateRegistration, validateLogin } = require('../utils/validate');

const BCRYPT_COST = 12;

async function registerUser({ name, email, password, profile } = {}) {
  const errors = validateRegistration({ name, email, password, profile });
  if (errors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', errors.join(', '));
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Pre-check avoids the hash cost; the unique index is the authoritative backstop
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'student',
      profile: profile || undefined,
    });
    return user;
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists');
    }
    throw err;
  }
}

async function loginUser({ email, password } = {}) {
  const errors = validateLogin({ email, password });
  if (errors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', errors.join(', '));
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');

  // Generic message for both wrong password and unknown email - no account enumeration
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'ACCOUNT_DISABLED', 'This account has been disabled');
  }

  return user;
}

module.exports = { registerUser, loginUser };
