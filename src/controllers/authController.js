const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userModel = require('../models/userModel');
const { validateRegister, validateLogin } = require('../utils/validators');
const emailService = require('../services/emailService');

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    const { name, email, password, role } = req.body;
    if (userModel.findUserByEmail(email)) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    const hash = await bcrypt.hash(password, config.bcryptSaltRounds);
    const user = userModel.createUser({ name: name.trim(), email, password: hash, role });

    emailService.sendWelcomeEmail(user).catch((err) => {
      console.error('Failed to send welcome email:', err.message);
    });

    const token = signToken(user);
    return res.status(201).json({
      message: 'User registered successfully',
      user: userModel.sanitize(user),
      token,
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    const { email, password } = req.body;
    const user = userModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user);
    return res.json({
      message: 'Login successful',
      user: userModel.sanitize(user),
      token,
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, me };
