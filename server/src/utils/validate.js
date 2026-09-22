const { DEPARTMENTS } = require('../config/constants');

function validateRegistration({ name, email, password, profile } = {}) {
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('name is required');
  else if (name.trim().length > 100) errors.push('name must be at most 100 characters');

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('a valid email is required');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('password must be at least 8 characters');
  }

  if (profile != null) {
    if (typeof profile !== 'object' || Array.isArray(profile)) {
      errors.push('profile must be an object');
    } else {
      if (profile.department && !DEPARTMENTS.includes(profile.department)) {
        errors.push('profile.department is invalid');
      }
      if (
        profile.year != null &&
        (!Number.isInteger(profile.year) || profile.year < 1 || profile.year > 5)
      ) {
        errors.push('profile.year must be an integer between 1 and 5');
      }
      if (profile.rollNo != null && typeof profile.rollNo !== 'string') {
        errors.push('profile.rollNo must be a string');
      }
      if (profile.phone != null && typeof profile.phone !== 'string') {
        errors.push('profile.phone must be a string');
      }
    }
  }

  return errors;
}

function validateLogin({ email, password } = {}) {
  const errors = [];
  if (!email || typeof email !== 'string' || !email.trim()) errors.push('email is required');
  if (!password || typeof password !== 'string') errors.push('password is required');
  return errors;
}

module.exports = { validateRegistration, validateLogin };
