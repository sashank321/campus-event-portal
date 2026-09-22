require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || '',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
};

function validateEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGO_URI');
  if (env.isProd && !env.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length === 0) return { ok: true, missing };

  const message = `Missing environment variables: ${missing.join(', ')}`;
  if (env.isProd) {
    console.error(`[env] ${message}`);
    process.exit(1);
  }
  console.warn(`[env] ${message} (continuing in development mode)`);
  return { ok: false, missing };
}

module.exports = { env, validateEnv };
