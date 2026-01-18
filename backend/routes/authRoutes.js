// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Define the paths
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;