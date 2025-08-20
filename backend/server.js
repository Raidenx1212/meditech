require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const fileRoutes = require('./routes/file.routes');
const healthRoutes = require('./routes/health.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const medicalRecordRoutes = require('./routes/medicalRecord.routes');
const adminRoutes = require('./routes/admin.routes');
const medicalDocRoutes = require('./routes/medicalDoc.routes');
const doctorRoutes = require('./routes/doctor.routes');
const notificationRoutes = require('./routes/notification.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api', fileRoutes);
app.use('/api', healthRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medical-docs', medicalDocRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// Get MongoDB URI from environment - NO HARDCODED CREDENTIALS
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your environment variables.');
  process.exit(1);
}

// Enhanced MongoDB connection with better error handling for production
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('MongoDB URI set:', !!process.env.MONGODB_URI);
    
    // Clean up the URI - remove any extra parameters that might cause issues
    let cleanURI = MONGODB_URI;
    
    // Ensure we're connecting to the right database
    if (!cleanURI.includes('/meditech')) {
      cleanURI = cleanURI.replace(/\/([^/?]*)(\?|$)/, '/meditech$2');
    }
    
    // Remove appName parameter as it can cause issues in production
    cleanURI = cleanURI.replace(/&appName=[^&]*/, '');
    
    console.log('Final MongoDB URI:', cleanURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
    
    const conn = await mongoose.connect(cleanURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout for production
      socketTimeoutMS: 45000,
      maxPoolSize: 5, // Reduced for Render's free tier
      minPoolSize: 1,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    // Provide specific guidance based on error type
    if (error.name === 'MongoNetworkError') {
      console.error('🔧 Network Error - Possible solutions:');
      console.error('   1. Check MongoDB Atlas Network Access (allow 0.0.0.0/0)');
      console.error('   2. Verify connection string format');
      console.error('   3. Check if MongoDB Atlas cluster is running');
    } else if (error.name === 'MongoParseError') {
      console.error('🔧 Parse Error - Check connection string format');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('🔧 Server Selection Error - Check network access and credentials');
    }
    
    console.error('Full error details:', error);
    
    // Don't exit immediately in production, let the app try to start
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Continuing without database connection in production...');
      return null;
    } else {
      process.exit(1);
    }
  }
};

// Connect to MongoDB and start server
connectDB().then((conn) => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (conn) {
      console.log(`✅ Database: Connected to MongoDB`);
    } else {
      console.log(`⚠️  Database: Not connected - some features may not work`);
    }
    
    console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  
  // In production, try to start server anyway for debugging
  if (process.env.NODE_ENV === 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT} (without database)`);
      console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
    });
  } else {
    process.exit(1);
  }
}); 