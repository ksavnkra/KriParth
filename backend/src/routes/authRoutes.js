const express = require('express');
const router = express.Router();
const { login, register, getProfile, getUsers, updateUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', protect, admin, register);
router.get('/profile', protect, getProfile);
router.get('/users', protect, admin, getUsers);
router.put('/users/:id', protect, admin, updateUser);

module.exports = router;
