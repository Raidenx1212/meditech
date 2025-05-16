const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const medicalRecordController = require('../backend/controllers/medicalRecord.controller');
const authMiddleware = require('../backend/middleware/auth.middleware');

// <--- Add these debug lines
console.log('--- DEBUG START ---');
console.log('Type of medicalRecordController:', typeof medicalRecordController);
console.log('Keys in medicalRecordController:', medicalRecordController ? Object.keys(medicalRecordController) : 'medicalRecordController is undefined/null');
console.log('medicalRecordController.getMedicalRecord:', medicalRecordController ? medicalRecordController.getMedicalRecord : 'medicalRecordController is undefined/null');
console.log('Type of medicalRecordController.getMedicalRecord:', medicalRecordController ? typeof medicalRecordController.getMedicalRecord : 'medicalRecordController is undefined/null');
console.log('--- DEBUG END ---');
// --- End of debug lines --->

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter for document uploads
const fileFilter = (req, file, cb) => {
  // Accept common document file types
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all medical records (admin only)
router.get('/', authMiddleware.protect, medicalRecordController.getAllMedicalRecords);

// Get medical records for a specific patient
router.get('/patient/:patientId', authMiddleware.protect, medicalRecordController.getMedicalRecords);

// Get a single medical record
router.get('/:id', authMiddleware.protect, medicalRecordController.getMedicalRecord);

// Create a new medical record (with optional document upload)
router.post('/', 
  authMiddleware.protect, 
  upload.array('documents', 5), // Allow up to 5 documents
  medicalRecordController.createMedicalRecord
);

// Update a medical record (with optional document upload)
router.put('/:id', 
  authMiddleware.protect,
  upload.array('documents', 5),
  medicalRecordController.updateMedicalRecord
);

// Delete a medical record
router.delete('/:id', authMiddleware.protect, medicalRecordController.deleteMedicalRecord);

// Download a document
router.get('/:recordId/documents/:documentId/download', authMiddleware.protect, medicalRecordController.downloadDocument);

module.exports = router; 