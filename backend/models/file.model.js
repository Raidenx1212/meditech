const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileName: String,
  mimetype: String,
  data: Buffer,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema); 