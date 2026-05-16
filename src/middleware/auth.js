const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userModel = require('../models/userModel');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authorization header with Bearer token required' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = userModel.findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    req.user = userModel.sanitize(user);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
