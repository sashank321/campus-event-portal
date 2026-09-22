const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

// Only the claims needed for authorization - no user data beyond id + role
function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

module.exports = { signToken };
