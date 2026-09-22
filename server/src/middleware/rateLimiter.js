const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

function createAuthLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    limit: options.limit || (env.isProd ? 20 : 100),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later',
        },
      });
    },
  });
}

const authLimiter = createAuthLimiter();

module.exports = { createAuthLimiter, authLimiter };
