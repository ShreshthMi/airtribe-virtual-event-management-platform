const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/users/signup', authController.register);
router.post('/users/login', authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
