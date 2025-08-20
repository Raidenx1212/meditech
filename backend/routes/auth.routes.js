const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const checkDatabaseHealth = require('../middleware/dbHealth.middleware');

router.post('/register', checkDatabaseHealth, authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getCurrentUser);
router.put('/me', protect, authController.updateCurrentUser);
router.get('/check-wallet', authController.checkWallet);
router.get('/check-email-wallet', authController.checkEmailWallet);
router.post('/change-password', protect, authController.changePassword);
router.post('/logout', protect, authController.logout);

module.exports = router; 
// For clarity in server.js, you may want to use:
// module.exports = { authRouter: router }; 