const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role, walletAddress: user.walletAddress },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, password, walletAddress, firstName, lastName, role } = req.body;
    if (!email || !password || !walletAddress || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Email, password, wallet address, first name, and last name are required.' });
    }
    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }
    if (await User.findOne({ walletAddress })) {
      return res.status(400).json({ success: false, message: 'Wallet address already registered.' });
    }
    const user = new User({ email, password, walletAddress, firstName, lastName, role: role || 'patient' });
    await user.save();
    res.status(201).json({ success: true, message: 'User registered' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password. Please try again.' });
    }
    const token = generateToken(user);
    res.json({ success: true, token, user: { _id: user._id, email: user.email, walletAddress: user.walletAddress, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkWallet = async (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ success: false, message: 'Wallet address is required' });
  const user = await User.findOne({ walletAddress });
  if (user) {
    // Mask email for privacy
    const masked = user.email.replace(/^(.).+(.@.+)$/, (m, a, b) => a + '****' + b);
    return res.json({ success: true, walletAddress: user.walletAddress, email: masked, fullEmail: user.email });
  }
  return res.status(404).json({ success: false, message: 'Wallet not registered' });
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { _id: user._id, email: user.email, walletAddress: user.walletAddress, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { firstName, lastName, specialization, licenseNumber } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'First name and last name are required.' });
    }
    const update = { firstName, lastName };
    if (specialization !== undefined) update.specialization = specialization;
    if (licenseNumber !== undefined) update.licenseNumber = licenseNumber;
    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { _id: user._id, email: user.email, walletAddress: user.walletAddress, firstName: user.firstName, lastName: user.lastName, specialization: user.specialization, licenseNumber: user.licenseNumber } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkEmailWallet = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    
    const user = await User.findOne({ email });
    if (user) {
      // Mask email for privacy
      const masked = user.email.replace(/^(.).+(.@.+)$/, (m, a, b) => a + '****' + b);
      return res.json({ success: true, walletAddress: user.walletAddress, email: masked, fullEmail: user.email });
    }
    return res.status(404).json({ success: false, message: 'User not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}; 