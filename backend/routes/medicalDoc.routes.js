const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/medicalDoc.controller');

// Doctor uploads document
router.post('/', protect, ctrl.uploadDoc);

// Patient views pending docs
router.get('/pending', protect, ctrl.getPendingDocs);

// Patient approves/rejects doc
router.patch('/:id/status', protect, ctrl.updateDocStatus);

// Patient views approved/rejected docs
router.get('/approved', protect, ctrl.getApprovedDocs);
router.get('/rejected', protect, ctrl.getRejectedDocs);

// Doctor views their own confirmed (approved) documents
router.get('/doctor/confirmed', protect, ctrl.getDoctorConfirmedDocs);

// Download medical document file
router.get('/:id/download', protect, ctrl.downloadMedicalDoc);

module.exports = router;
