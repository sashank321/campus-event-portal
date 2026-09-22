const { env } = require('../config/env');

const COOKIE_NAME = 'token';

function parseExpiresToMs(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn || '30m');
  if (!match) return 30 * 60 * 1000;
  const units = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return parseInt(match[1], 10) * units[match[2]];
}

function makeAuthCookieOptions(isProd) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(isProd),
    path: '/',
    maxAge: parseExpiresToMs(env.jwtExpiresIn),
  };
}

function makeAuthCookieClearOptions(isProd) {
  const { maxAge, ...clearOptions } = makeAuthCookieOptions(isProd);
  return clearOptions;
}

module.exports = { COOKIE_NAME, makeAuthCookieOptions, makeAuthCookieClearOptions, parseExpiresToMs };
