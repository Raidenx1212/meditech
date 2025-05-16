const mongoose = require('mongoose');

const checkAppointmentAccess = async (req, res, next) => {
  try {
    console.log('checkAppointmentAccess - req.user:', req.user);

    // Skip access check for admin users
    if (req.user.role === 'admin') {
      return next();
    }

    const appointmentId = req.params.id;
    const userId = req.user._id || req.user.id || req.user.userId;
    const userRole = req.user.role;

    // For listing appointments without a specific ID
    if (!appointmentId) {
      // Doctors can only see their appointments
      if (userRole === 'doctor') {
        req.query.doctorId = userId;
      }
      // Patients can only see their appointments
      else if (userRole === 'patient') {
        req.query.patientId = userId;
      }
      return next();
    }

    // Validate appointment ID format
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: 'Invalid appointment ID format' });
    }

    // For specific appointment access
    const Appointment = require('../models/appointment.model');
    const appointment = await Appointment.findById(appointmentId);

    console.log('checkAppointmentAccess - Retrieved appointment:', appointment);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Normalize IDs to strings for comparison
    const normalizedUserId = userId.toString();
    const normalizedDoctorId = appointment.doctorId.toString();
    const normalizedPatientId = appointment.patientId.toString();

    // Log the normalized IDs
    console.log('Normalized IDs:', {
      normalizedUserId,
      normalizedDoctorId,
      normalizedPatientId
    });

    // Check if user has permission to access this appointment
    const hasAccess = 
      (userRole === 'doctor' && normalizedDoctorId === normalizedUserId) ||
      (userRole === 'patient' && normalizedPatientId === normalizedUserId);

    if (!hasAccess) {
      console.log('Access denied details:', {
        userRole,
        userId: normalizedUserId,
        appointmentDoctorId: normalizedDoctorId,
        appointmentPatientId: normalizedPatientId
      });
      return res.status(403).json({ 
        message: 'Access denied: You can only view your own appointments',
        details: {
          userRole,
          userId: normalizedUserId,
          appointmentDoctorId: normalizedDoctorId,
          appointmentPatientId: normalizedPatientId
        }
      });
    }

    // Add appointment to request object for potential use in later middleware
    req.appointment = appointment;
    next();
  } catch (error) {
    console.error('Error in appointment authorization:', error);
    res.status(500).json({ message: 'Error checking appointment access', error: error.message });
  }
};

module.exports = {
  checkAppointmentAccess
}; 