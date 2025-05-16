const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth.middleware');
const User = require('../models/user.model');

// You can add other admin routes here if needed

module.exports = router; 