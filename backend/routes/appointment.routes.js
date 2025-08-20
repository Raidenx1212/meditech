const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkAppointmentAccess } = require('../middleware/appointmentAuth.middleware');
const { checkDoctorAccess } = require('../middleware/doctorAccess.middleware');

// Route for doctor appointments
router.get('/doctor/:doctorId', protect, checkDoctorAccess, appointmentController.getAppointmentsByDoctor);

// Get all appointments (with pagination)
router.get('/', protect, checkAppointmentAccess, appointmentController.getAllAppointments);

// Get appointment by ID
router.get('/:id', protect, checkAppointmentAccess, appointmentController.getAppointmentById);

// Create new appointment
router.post('/', protect, appointmentController.createAppointment);

// Update appointment
router.put('/:id', protect, checkAppointmentAccess, appointmentController.updateAppointment);

// Update appointment status
router.patch('/:id/status', protect, checkAppointmentAccess, appointmentController.updateAppointmentStatus);

// Get available appointment slots
router.get('/available-slots', protect, appointmentController.getAvailableSlots);

// Get appointments for a specific patient
router.get('/patient/:patientId', protect, appointmentController.getAppointmentsByPatient);

// Refresh patient info for an appointment
router.get('/:appointmentId/refresh-patient-info', protect, appointmentController.refreshPatientInfo);

module.exports = router; 