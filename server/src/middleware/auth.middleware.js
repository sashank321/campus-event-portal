const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');
const { COOKIE_NAME } = require('../utils/cookies');
const { User } = require('../models');

async function protect(req, res, next) {
  try {
    const token = req.cookies ? req.cookies[COOKIE_NAME] : undefined;
    if (!token) {
      throw new ApiError(401, 'AUTH_REQUIRED', 'Authentication required');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'AUTH_EXPIRED', 'Session expired, please log in again');
      }
      throw new ApiError(401, 'AUTH_INVALID', 'Invalid authentication token');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'AUTH_INVALID', 'Account no longer exists');
    }
    if (!user.isActive) {
      throw new ApiError(403, 'ACCOUNT_DISABLED', 'This account has been disabled');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action')
      );
    }
    next();
  };
}

// Attaches req.user when a valid cookie is present; never rejects.
// Used on public endpoints that reveal more to managers (e.g. own pending events).
async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies ? req.cookies[COOKIE_NAME] : undefined;
    if (token) {
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Invalid/expired token on a public endpoint - treat as anonymous
  }
  next();
}

module.exports = { protect, authorize, optionalAuth, COOKIE_NAME };
