const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  contactNumber: { type: String },
  address: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // doctor who created
  medicalRecords: [
    {
      filename: String,
      mimetype: String,
      data: Buffer,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  pendingDocuments: [
    {
      filename: String,
      mimetype: String,
      data: Buffer,
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema); 