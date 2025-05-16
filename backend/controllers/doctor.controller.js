const User = require('../models/user.model');

exports.listDoctors = async (req, res) => {
  const doctors = await User.find({ role: 'doctor' }, '-password');
  res.json({ success: true, doctors });
};

exports.addDoctor = async (req, res) => {
  const { email, password, firstName, lastName, walletAddress } = req.body;
  if (!email || !password || !firstName || !lastName || !walletAddress) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ success: false, message: 'Doctor already exists' });
  }
  const doctor = new User({ email, password, firstName, lastName, walletAddress, role: 'doctor' });
  await doctor.save();
  res.json({ success: true, doctor: { ...doctor.toObject(), password: undefined } });
};

exports.removeDoctor = async (req, res) => {
  await User.deleteOne({ _id: req.params.id, role: 'doctor' });
  res.json({ success: true });
}; 