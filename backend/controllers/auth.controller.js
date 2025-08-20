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
    console.log('🔄 Registration attempt started');
    
    const { email, password, walletAddress, firstName, lastName, role } = req.body;
    if (!email || !password || !walletAddress || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Email, password, wallet address, first name, and last name are required.' });
    }
    
    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format.' });
    }
    
    console.log('🔍 Checking for existing user with email:', email);
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }
    
    console.log('🔍 Checking for existing user with wallet:', walletAddress);
    const existingUserByWallet = await User.findOne({ walletAddress });
    if (existingUserByWallet) {
      return res.status(400).json({ success: false, message: 'Wallet address already registered.' });
    }
    
    console.log('✅ Creating new user');
    const user = new User({ email, password, walletAddress, firstName, lastName, role: role || 'patient' });
    await user.save();
    
    console.log('✅ User registered successfully:', user._id);
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    console.error('🔍 Error details:', {
      name: err.name,
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    
    // Check if it's a MongoDB connection error
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is not accessible. Please try again later or contact support.',
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    // Check if it's a validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', '),
        error: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.',
      error: 'INTERNAL_SERVER_ERROR'
    });
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

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId || req.user._id || req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. However, we can implement server-side
    // token blacklisting if needed in the future.
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 