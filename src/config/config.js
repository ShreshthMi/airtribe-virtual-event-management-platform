require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';
const isDev = nodeEnv === 'development';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isTest || isDev) {
    jwtSecret = 'dev-only-insecure-secret';
    if (isDev) {
      console.warn('[config] JWT_SECRET not set — using insecure dev fallback. Set JWT_SECRET in .env before deploying.');
    }
  } else {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
}

const config = {
  nodeEnv,
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Virtual Events <no-reply@virtual-events.local>',
  },
  isTest,
  isDev,
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
};

module.exports = config;
