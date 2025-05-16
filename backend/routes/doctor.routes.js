const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const doctorCtrl = require('../controllers/doctor.controller');

// You may want to add an adminOnly middleware for extra security
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admins only' });
};

router.get('/', protect, adminOnly, doctorCtrl.listDoctors);
router.post('/', protect, adminOnly, doctorCtrl.addDoctor);
router.delete('/:id', protect, adminOnly, doctorCtrl.removeDoctor);

module.exports = router; 