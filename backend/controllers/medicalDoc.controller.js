const MedicalDoc = require('../models/medicalDoc.model');
const Appointment = require('../models/appointment.model');
const blockchainService = require('../services/blockchain.service');

// Doctor uploads document (only for confirmed appointments)
exports.uploadDoc = async (req, res) => {
  try {
    const { appointmentId, fileId, description } = req.body;
    const doctorId = req.user.userId;
    
    console.log('MedicalDoc upload attempt:', { appointmentId, fileId, doctorId });
    
    // Check if file was uploaded
    if (!fileId) {
      return res.status(400).json({ 
        success: false, 
        message: 'File ID is required. Please upload a file first using /api/upload' 
      });
    }
    
    // Check appointment exists and is confirmed
    const appointment = await Appointment.findOne({ 
      _id: appointmentId, 
      doctorId, 
      status: 'confirmed' 
    });
    
    if (!appointment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment not found or not confirmed.' 
      });
    }
    
    const patientId = appointment.patientId;
    
    // Create medical document record with fileId instead of fileUrl
    const doc = await MedicalDoc.create({ 
      appointmentId, 
      doctorId, 
      patientId, 
      fileId, // Use fileId to reference the uploaded file
      description 
    });
    
    console.log('Medical document created:', doc._id);
    res.status(201).json({ success: true, doc });
  } catch (err) {
    console.error('Medical doc upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Patient views pending docs
exports.getPendingDocs = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const docs = await MedicalDoc.find({ patientId, status: 'pending' })
      .populate('fileId', 'fileName mimetype uploadedAt')
      .populate('doctorId', 'firstName lastName');
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
    const docs = await MedicalDoc.find({ patientId, status: 'approved' })
      .populate('fileId', 'fileName mimetype uploadedAt')
      .populate('doctorId', 'firstName lastName');
    res.json({ success: true, docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get rejected docs
exports.getRejectedDocs = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const docs = await MedicalDoc.find({ patientId, status: 'rejected' })
      .populate('fileId', 'fileName mimetype uploadedAt')
      .populate('doctorId', 'firstName lastName');
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
      .populate('patientId', 'firstName lastName')
      .populate('fileId', 'fileName mimetype uploadedAt');
    res.json({ success: true, docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Download medical document file
exports.downloadMedicalDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Find the medical document
    const medDoc = await MedicalDoc.findById(id).populate('fileId');
    
    if (!medDoc) {
      return res.status(404).json({ success: false, message: 'Medical document not found' });
    }
    
    // Check if user has permission to download (patient, doctor, or admin)
    const isAuthorized = medDoc.patientId === userId || 
                        medDoc.doctorId === userId || 
                        req.user.role === 'admin';
                        
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Get the file
    const file = medDoc.fileId;
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Send the file
    res.set('Content-Type', file.mimetype);
    res.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(file.data);
    
  } catch (err) {
    console.error('Download medical doc error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
