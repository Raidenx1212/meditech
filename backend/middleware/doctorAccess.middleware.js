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
      // Support _id, id, or userId
      const doctorId = req.user._id || req.user.id || req.user.userId;
      
      // If all are undefined, return an error
      if (!doctorId) {
        console.error('Doctor ID not found in token - user object:', req.user);
        return res.status(400).json({ 
          message: 'Error checking doctor access', 
          error: 'Doctor ID not found in authentication token' 
        });
      }
      
      const doctorIdFromToken = doctorId.toString();
      
      if (req.params.doctorId !== doctorIdFromToken) {
        return res.status(403).json({ message: 'Access denied: You can only view your own appointments' });
      }
      return next();
    }

    // Patients or others are denied access
    return res.status(403).json({ message: 'Access denied: Patients cannot view doctor appointments' });
  } catch (err) {
    console.error('Error in doctorAccess middleware:', err);
    return res.status(500).json({ message: 'Error checking doctor access', error: err.message });
  }
};

module.exports = { checkDoctorAccess }; 