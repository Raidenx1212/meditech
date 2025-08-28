const mongoose = require('mongoose');

const medicalDocSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  doctorId: { type: String, required: true },
  patientId: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true }, // Reference to File model
  fileUrl: { type: String }, // Keep for backward compatibility but not required
  description: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploadedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: String }, // patientId
  blockchainTxHash: { type: String }, // Ethereum transaction hash for blockchain record
  blockchainTimestamp: { type: Number } // Timestamp when recorded on blockchain
});

module.exports = mongoose.model('MedicalDoc', medicalDocSchema); 