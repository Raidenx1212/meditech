const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const notificationCtrl = require('../controllers/notification.controller');

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admins only' });
};

router.post('/doctors', protect, adminOnly, notificationCtrl.notifyDoctors);
router.post('/patients', protect, adminOnly, notificationCtrl.notifyPatients);
router.post('/custom', protect, adminOnly, notificationCtrl.notifyCustom);

module.exports = router; 