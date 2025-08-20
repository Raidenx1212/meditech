const checkDoctorAccess = (req, res, next) => {
  try {
    // Check if user exists in request
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Allow admin users full access
    if (req.user.role === 'admin') return next();

    // Only doctors can access this route
    if (req.user.role === 'doctor') {
      console.log('Doctor access granted for:', req.user.firstName || req.user.name);
      return next();
    }

    // Patients or others are denied access
    return res.status(403).json({ message: 'Access denied: Only doctors can view doctor appointments' });
  } catch (err) {
    console.error('Error in doctorAccess middleware:', err);
    return res.status(500).json({ message: 'Error checking doctor access', error: err.message });
  }
};

module.exports = { checkDoctorAccess }; 