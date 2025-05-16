const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getCurrentUser);
router.put('/me', protect, authController.updateCurrentUser);
router.get('/check-wallet', authController.checkWallet);

module.exports = router; 
// For clarity in server.js, you may want to use:
// module.exports = { authRouter: router }; 