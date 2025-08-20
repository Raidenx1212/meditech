const mongoose = require('mongoose');

const checkDatabaseHealth = (req, res, next) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  if (!isConnected) {
    console.error('❌ Database not connected. ReadyState:', mongoose.connection.readyState);
    return res.status(503).json({
      success: false,
      message: 'Database is not accessible. Please try again later or contact support.',
      error: 'DATABASE_CONNECTION_ERROR',
      readyState: mongoose.connection.readyState
    });
  }
  
  // Test database with a simple ping
  mongoose.connection.db.admin().ping()
    .then(() => {
      console.log('✅ Database health check passed');
      next();
    })
    .catch((error) => {
      console.error('❌ Database health check failed:', error);
      return res.status(503).json({
        success: false,
        message: 'Database is not accessible. Please try again later or contact support.',
        error: 'DATABASE_PING_FAILED',
        details: error.message
      });
    });
};

module.exports = checkDatabaseHealth;
