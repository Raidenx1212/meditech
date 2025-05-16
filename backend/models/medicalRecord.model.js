const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Diagnosis', 'Medication', 'Procedure', 'Lab Test', 'Vaccination', 'Other']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  doctor: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Completed', 'Scheduled', 'Cancelled'],
    default: 'Active'
  },
  notes: {
    type: String
  },
  instructions: {
    type: String
  },
  result: {
    type: String
  },
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord; 