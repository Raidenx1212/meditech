const MedicalRecord = require('../models/medicalRecord.model');
const Patient = require('../models/patient.model');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Set upload directory for documents
const UPLOADS_DIR = path.join(__dirname, '../../uploads/documents');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Get all medical records for a specific patient
exports.getMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Validate patientId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID format' });
    }
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Get medical records for the patient
    const records = await MedicalRecord.find({ patientId })
      .sort({ date: -1 }) // Sort by date, newest first
      .lean(); // Convert to plain JavaScript objects
    
    return res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return res.status(500).json({
      message: 'Error fetching medical records',
      error: error.message
    });
  }
};

// Get all medical records (admin only)
exports.getAllMedicalRecords = async (req, res) => {
  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalRecords = await MedicalRecord.countDocuments();
    
    // Get records with pagination
    const records = await MedicalRecord.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('patientId', 'firstName lastName dateOfBirth')
      .lean();
    
    return res.status(200).json({
      success: true,
      count: records.length,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
      records
    });
  } catch (error) {
    console.error('Error fetching all medical records:', error);
    return res.status(500).json({
      message: 'Error fetching all medical records',
      error: error.message
    });
  }
};

// Get a single medical record by ID
exports.getMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID format' });
    }
    
    // Find record
    const record = await MedicalRecord.findById(id)
      .populate('patientId', 'firstName lastName dateOfBirth')
      .lean();
    
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    return res.status(200).json({
      success: true,
      record
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    return res.status(500).json({
      message: 'Error fetching medical record',
      error: error.message
    });
  }
};

// Create a new medical record
exports.createMedicalRecord = async (req, res) => {
  try {
    const { patientId, type, date, doctor, details, department, status, notes, instructions, result } = req.body;
    
    // Validate required fields
    if (!patientId || !type || !doctor || !details) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate patient exists
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID format' });
    }
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create new record
    const newRecord = new MedicalRecord({
      patientId,
      type,
      date: date || new Date(),
      doctor,
      details,
      department,
      status: status || 'Active',
      notes,
      instructions,
      result,
      createdBy: req.user ? req.user._id : null
    });
    
    // If files were uploaded, add them to the record
    if (req.files && req.files.length > 0) {
      newRecord.documents = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
    }
    
    // Save record
    await newRecord.save();
    
    return res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      record: newRecord
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    return res.status(500).json({
      message: 'Error creating medical record',
      error: error.message
    });
  }
};

// Update a medical record
exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID format' });
    }
    
    // Find existing record
    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Update only allowed fields
    const allowedUpdates = ['type', 'date', 'doctor', 'details', 'department', 'status', 'notes', 'instructions', 'result'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        record[key] = updates[key];
      }
    });
    
    // If new files were uploaded, add them to the record
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
      
      // Add new documents to existing ones
      record.documents = [...(record.documents || []), ...newDocuments];
    }
    
    // Update timestamp
    record.updatedAt = new Date();
    
    // Save updates
    await record.save();
    
    return res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      record
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    return res.status(500).json({
      message: 'Error updating medical record',
      error: error.message
    });
  }
};

// Delete a medical record
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID format' });
    }
    
    // Find and delete record
    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Delete any associated document files
    if (record.documents && record.documents.length > 0) {
      record.documents.forEach(doc => {
        if (doc.path && fs.existsSync(doc.path)) {
          fs.unlinkSync(doc.path);
        }
      });
    }
    
    await record.deleteOne();
    
    return res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    return res.status(500).json({
      message: 'Error deleting medical record',
      error: error.message
    });
  }
};

// Download a document
exports.downloadDocument = async (req, res) => {
  try {
    const { recordId, documentId } = req.params;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Invalid record ID format' });
    }
    
    // Find the record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    // Find the document in the record
    const document = record.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if file exists
    if (!document.path || !fs.existsSync(document.path)) {
      return res.status(404).json({ message: 'Document file not found' });
    }
    
    // Send the file
    res.download(document.path, document.originalName);
  } catch (error) {
    console.error('Error downloading document:', error);
    return res.status(500).json({
      message: 'Error downloading document',
      error: error.message
    });
  }
};

// Get access logs for a medical record
exports.getAccessLogs = async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // Validate recordId format
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid record ID format' 
      });
    }
    
    // Find the medical record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medical record not found' 
      });
    }
    
    // For now, return a mock access log since we don't have a dedicated access log model
    // In a real implementation, you would have an AccessLog model
    const accessLogs = [
      {
        id: '1',
        recordId: recordId,
        userId: req.user ? req.user._id : null,
        userEmail: req.user ? req.user.email : 'Unknown',
        action: 'view',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || 'Unknown',
        userAgent: req.get('User-Agent') || 'Unknown'
      }
    ];
    
    return res.status(200).json({
      success: true,
      recordId: recordId,
      accessLogs: accessLogs,
      totalLogs: accessLogs.length
    });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching access logs',
      error: error.message
    });
  }
}; 