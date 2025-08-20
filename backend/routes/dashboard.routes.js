const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// Dashboard stats endpoint
router.get('/stats', protect, async (req, res) => {
  try {
    const User = require('../models/user.model');
    const Appointment = require('../models/appointment.model');
    const MedicalRecord = require('../models/medicalRecord.model');
    
    // Get counts for different user types
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    // Get appointment stats
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    
    // Get medical record stats
    const totalRecords = await MedicalRecord.countDocuments();
    
    res.json({
      success: true,
      stats: {
        users: {
          patients: patientCount,
          doctors: doctorCount,
          admins: adminCount,
          total: patientCount + doctorCount + adminCount
        },
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          completed: completedAppointments
        },
        records: {
          total: totalRecords
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dashboard activity endpoint
router.get('/activity', protect, async (req, res) => {
  try {
    const Appointment = require('../models/appointment.model');
    const MedicalRecord = require('../models/medicalRecord.model');
    
    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName');
    
    // Get recent medical records
    const recentRecords = await MedicalRecord.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('patientId', 'firstName lastName');
    
    res.json({
      success: true,
      activity: {
        appointments: recentAppointments,
        records: recentRecords
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 