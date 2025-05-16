const Patient = require('../models/patient.model');

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    // For patients, only fetch patients they created
    // For doctors and admins, fetch all patients
    let query = {};
    
    if (req.user.role === 'patient') {
      // Patients can only view their own records
      query = { createdBy: req.user.userId };
    } 
    // Doctors and admins can view all patients
    
    // Fetch patients with basic info about who created them
    const patients = await Patient.find(query)
      .populate('createdBy', 'firstName lastName email role')
      .select('firstName lastName dateOfBirth gender contactNumber email address createdAt createdBy')
      .sort({ createdAt: -1 });
    
    // Fallback for legacy data
    const patientsWithFallback = patients.map(p => {
      if (!p.createdBy) {
        p.createdBy = {
          firstName: req.user.firstName || '',
          lastName: req.user.lastName || '',
          role: req.user.role || 'unknown'
        };
      }
      return p;
    });
    
    res.json({ success: true, patients: patientsWithFallback });
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ success: false, message: 'Failed to load patients', error: err.message });
  }
};

// Add a new patient (doctors, nurses, admins, or patients)
exports.addPatient = async (req, res) => {
  try {
    // Allow all roles to add patients
    const { firstName, lastName, email, dateOfBirth, gender, contactNumber, address } = req.body;
    // Handle uploaded files
    let medicalRecords = [];
    if (req.files && req.files.length > 0) {
      medicalRecords = req.files.map(file => ({
        filename: file.originalname,
        mimetype: file.mimetype,
        data: file.buffer,
        uploadedAt: new Date()
      }));
    }
    const patient = new Patient({
      firstName, lastName, email, dateOfBirth, gender, contactNumber, address,
      createdBy: req.user.userId,
      medicalRecords
    });
    await patient.save();
    res.status(201).json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add patient', error: err.message });
  }
};

// Edit a patient (doctors only)
exports.editPatient = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can edit patients' });
    }
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to edit patient', error: err.message });
  }
};

// Delete a patient (doctors only)
exports.deletePatient = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can delete patients' });
    }
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete patient', error: err.message });
  }
};

// Get a patient by ID
exports.getPatientById = async (req, res) => {
  try {
    // For role-based access
    if (req.user.role === 'patient') {
      // Patients can only view patients they created
      const patient = await Patient.findOne({ 
        _id: req.params.id,
        createdBy: req.user.userId
      }).populate('createdBy', 'firstName lastName role');
      if (!patient) {
        return res.status(404).json({ 
          success: false, 
          message: 'Patient record not found or you are not authorized to view this record' 
        });
      }
      // Fallback for legacy data
      if (!patient.createdBy) {
        patient.createdBy = {
          firstName: req.user.firstName || '',
          lastName: req.user.lastName || '',
          role: req.user.role || 'unknown'
        };
      }
      return res.json({ success: true, patient });
    }
    // Doctors and admins can view any patient's record
    const patient = await Patient.findById(req.params.id).populate('createdBy', 'firstName lastName role');
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }
    // Fallback for legacy data
    if (!patient.createdBy) {
      patient.createdBy = {
        firstName: req.user.firstName || '',
        lastName: req.user.lastName || '',
        role: req.user.role || 'unknown'
      };
    }
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch patient', 
      error: err.message 
    });
  }
};

// Doctor uploads a pending document for a patient
exports.uploadPendingDocument = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can upload documents' });
    }
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const pendingDoc = {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      data: req.file.buffer,
      uploadedAt: new Date(),
      uploadedBy: req.user.userId,
      appointmentId: req.body.appointmentId || null
    };
    patient.pendingDocuments.push(pendingDoc);
    await patient.save();
    res.status(201).json({ success: true, message: 'Document uploaded for approval', pendingDocument: pendingDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload document', error: err.message });
  }
};

// Patient approves a pending document
exports.approvePendingDocument = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can approve documents' });
    }
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const docIndex = patient.pendingDocuments.findIndex(doc => doc._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ success: false, message: 'Pending document not found' });
    const approvedDoc = patient.pendingDocuments[docIndex];
    patient.medicalRecords.push(approvedDoc);
    patient.pendingDocuments.splice(docIndex, 1);
    await patient.save();
    res.json({ success: true, message: 'Document approved and added to medical records', approvedDocument: approvedDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve document', error: err.message });
  }
};

// Patient rejects a pending document
exports.rejectPendingDocument = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can reject documents' });
    }
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const docIndex = patient.pendingDocuments.findIndex(doc => doc._id.toString() === req.params.docId);
    if (docIndex === -1) return res.status(404).json({ success: false, message: 'Pending document not found' });
    const rejectedDoc = patient.pendingDocuments[docIndex];
    patient.pendingDocuments.splice(docIndex, 1);
    await patient.save();
    res.json({ success: true, message: 'Document rejected and removed', rejectedDocument: rejectedDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject document', error: err.message });
  }
}; 