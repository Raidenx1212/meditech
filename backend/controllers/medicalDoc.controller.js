const MedicalDoc = require('../models/medicalDoc.model');
const Appointment = require('../models/appointment.model');
const blockchainService = require('../services/blockchain.service');

// Doctor uploads document (only for confirmed appointments)
exports.uploadDoc = async (req, res) => {
  try {
    const { appointmentId, fileUrl, description } = req.body;
    const doctorId = req.user.userId;
    // Check appointment exists and is confirmed
    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId, status: 'confirmed' });
    if (!appointment) {
      return res.status(400).json({ success: false, message: 'Appointment not found or not confirmed.' });
    }
    const patientId = appointment.patientId;
    const doc = await MedicalDoc.create({ appointmentId, doctorId, patientId, fileUrl, description });
    res.status(201).json({ success: true, doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Patient views pending docs
exports.getPendingDocs = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const docs = await MedicalDoc.find({ patientId, status: 'pending' });
    res.json({ success: true, docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Patient approves/rejects doc
exports.updateDocStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false });
    
    const doc = await MedicalDoc.findOneAndUpdate(
      { _id: id, patientId: req.user.userId, status: 'pending' },
      { status, reviewedAt: new Date(), reviewedBy: req.user.userId },
      { new: true }
    );
    
    if (!doc) return res.status(404).json({ success: false });

    // If document is approved, record it on blockchain
    if (status === 'approved') {
      try {
        // Get contract instance
        const contract = await blockchainService.getContractInstance();
        
        // Create a hash of the document data
        const documentData = {
          docId: doc._id.toString(),
          patientId: doc.patientId.toString(),
          doctorId: doc.doctorId.toString(),
          timestamp: doc.reviewedAt.getTime(),
          fileUrl: doc.fileUrl
        };
        
        // Record the approval on blockchain
        const tx = await contract.addDocumentApproval(
          documentData.docId,
          documentData.patientId,
          documentData.doctorId,
          documentData.timestamp
        );
        
        // Wait for transaction to be mined
        await tx.wait();
        
        // Add blockchain transaction hash to the document
        doc.blockchainTxHash = tx.hash;
        await doc.save();
      } catch (blockchainError) {
        console.error('Blockchain recording failed:', blockchainError);
        // We still return success since the document is approved in our database
        // But we log the blockchain error for monitoring
      }
    }

    res.json({ success: true, doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get approved docs
exports.getApprovedDocs = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const docs = await MedicalDoc.find({ patientId, status: 'approved' });
    res.json({ success: true, docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get rejected docs
exports.getRejectedDocs = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const docs = await MedicalDoc.find({ patientId, status: 'rejected' });
    res.json({ success: true, docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Doctor views their own confirmed (approved) documents
exports.getDoctorConfirmedDocs = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    // Find all approved docs uploaded by this doctor
    const docs = await MedicalDoc.find({ doctorId, status: 'approved' })
      .populate('patientId', 'firstName lastName');
    res.json({ success: true, docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 