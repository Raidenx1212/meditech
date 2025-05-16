const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    default: 'Unknown Doctor'
  },
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    default: 'Unknown Patient'
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'missed'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Remove the unique constraint which could be causing issues when reusing time slots
// Instead, use a custom validation in the controller
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 