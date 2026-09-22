const authService = require('../services/auth.service');
const { signToken } = require('../utils/tokens');
const { safeUser } = require('../utils/serializers');
const { COOKIE_NAME, makeAuthCookieOptions, makeAuthCookieClearOptions } = require('../utils/cookies');
const { env } = require('../config/env');

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body || {});
    res.status(201).json({ data: { user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.loginUser(req.body || {});
    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, makeAuthCookieOptions(env.isProd));
    res.status(200).json({ data: { user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, makeAuthCookieClearOptions(env.isProd));
  res.status(200).json({ data: { message: 'Logged out' } });
}

function me(req, res) {
  res.status(200).json({ data: { user: safeUser(req.user) } });
}

module.exports = { register, login, logout, me };
