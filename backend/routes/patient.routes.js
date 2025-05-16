const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const patientController = require('../controllers/patient.controller');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { ethers } = require('ethers');
const { getContractInstance } = require('../services/blockchain.service');

// View patients (all users)
router.get('/', protect, patientController.getAllPatients);
// Add patient (doctors only)
router.post('/', protect, upload.array('medicalRecords'), patientController.addPatient);
// Edit patient (doctors only)
router.put('/:id', protect, patientController.editPatient);
// Delete patient (doctors only)
router.delete('/:id', protect, patientController.deletePatient);
// Get patient by ID (all users)
router.get('/:id', protect, patientController.getPatientById);
// Doctor uploads a pending document for a patient
router.post('/:id/pending-documents', protect, upload.single('file'), patientController.uploadPendingDocument);
// Patient approves a pending document
router.post('/:id/pending-documents/:docId/approve', protect, patientController.approvePendingDocument);
// Patient rejects a pending document
router.post('/:id/pending-documents/:docId/reject', protect, patientController.rejectPendingDocument);
// Get pending documents for a patient
router.get('/pending-documents/:address', async (req, res) => {
  const { address } = req.params;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid wallet address' 
    });
  }

  try {
    // Get the contract instance
    const contract = await getContractInstance();
    
    // Get all records for the patient
    const records = await contract.getRecords(address);
    
    // Get already approved documents from blockchain
    const approvedCids = await contract.getApprovedDocuments(address);
    
    // Filter out approved documents to get pending ones
    const pendingDocs = records
      .filter(record => !approvedCids.includes(record.ipfsHash))
      .map(record => ({
        cid: record.ipfsHash,
        timestamp: record.timestamp.toString(),
        // You can add more document metadata from your database here
      }));

    res.json({ 
      success: true, 
      documents: pendingDocs 
    });
    
  } catch (err) {
    console.error('Error fetching pending documents:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

module.exports = router; 