const File = require('../models/file.model');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

// Standard file upload for /api/upload (multer handles file saving)
exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const file = new File({
      user: req.user.userId,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      data: req.file.buffer
    });
    await file.save();
    res.json({ success: true, fileId: file._id, fileName: file.fileName });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.download = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    res.set('Content-Type', file.mimetype);
    res.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(file.data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const files = await File.find({ user: req.user.userId });
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 