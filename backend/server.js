require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

// Import Routes
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

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://meditech-one.vercel.app", // ✅ Allow frontend
  credentials: true
}));
app.use(bodyParser.json());

// Routes
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

// API status route
app.get('/api', (req, res) => {
  res.json({ message: '✅ MediTech API is running' });
});

// Root route for Render homepage
app.get('/', (req, res) => {
  res.send('🚀 MediTech Backend is running! Visit /api for API routes.');
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  process.exit(1);
}

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');

    let cleanURI = MONGODB_URI;
    if (!cleanURI.includes('/meditech')) {
      cleanURI = cleanURI.replace(/\/([^/?]*)(\?|$)/, '/meditech$2');
    }
    cleanURI = cleanURI.replace(/&appName=[^&]*/, '');

    console.log('🔗 Final MongoDB URI (sanitized):', cleanURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    const conn = await mongoose.connect(cleanURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 60000, // Increased socket timeout
      maxPoolSize: 10, // Increased pool size
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority',
      bufferCommands: true,
      bufferMaxEntries: 0
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log(`🔌 Connection State: ${conn.connection.readyState}`);
    
    // Test the connection with a simple operation
    await conn.connection.db.admin().ping();
    console.log('🏓 Database ping successful');
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('🔍 Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Continuing without DB in production...');
      return null;
    } else {
      process.exit(1);
    }
  }
};

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔄 MongoDB connection closed through app termination');
  process.exit(0);
});

// Start Server
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
  if (process.env.NODE_ENV === 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT} (without database)`);
    });
  } else {
    process.exit(1);
  }
});