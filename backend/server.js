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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// Get MongoDB URI from environment or use a default with explicit "meditech" database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reaper:Rajesh123007@reaper.b6fszir.mongodb.net/meditech?retryWrites=true&w=majority&appName=reaper';
console.log('Connecting to MongoDB URI:', MONGODB_URI); // Debug print

// Make sure the URI points to meditech database
const finalURI = MONGODB_URI.includes('/meditech') ? 
  MONGODB_URI : 
  MONGODB_URI.replace(/\/([^/?]*)(\?|$)/, '/meditech$2');

// Enhanced MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(finalURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    
    // If it's a network error, provide helpful message
    if (error.name === 'MongoNetworkError') {
      console.error('Network error - check if MongoDB Atlas allows connections from Render');
    }
    
    // Exit process with failure
    process.exit(1);
  }
};

// Connect to MongoDB and start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 