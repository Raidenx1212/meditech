const Notification = require('../models/notification.model');
const User = require('../models/user.model');

exports.notifyDoctors = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });
  const doctors = await User.find({ role: 'doctor' });
  await Promise.all(doctors.map(doc => Notification.create({ recipient: doc._id, message })));
  res.json({ success: true });
};

exports.notifyPatients = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });
  const patients = await User.find({ role: 'patient' });
  await Promise.all(patients.map(pat => Notification.create({ recipient: pat._id, message })));
  res.json({ success: true });
};

exports.notifyCustom = async (req, res) => {
  const { message, recipientIds } = req.body;
  if (!message || !recipientIds || !Array.isArray(recipientIds)) {
    return res.status(400).json({ success: false, message: 'Message and recipientIds required' });
  }
  await Promise.all(recipientIds.map(id => Notification.create({ recipient: id, message })));
  res.json({ success: true });
}; 