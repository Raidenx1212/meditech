require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const authRoutes = require('./backend/routes/auth.routes');
const fileRoutes = require('./backend/routes/file.routes');
const healthRoutes = require('./backend/routes/health.routes');
const patientRoutes = require('./backend/routes/patient.routes');
const appointmentRoutes = require('./backend/routes/appointment.routes');
const medicalRecordRoutes = require('./routes/medicalRecord.routes');
const blockchainRoutes = require('./backend/routes/blockchain.routes');

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
app.use('/api/blockchain', blockchainRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// Get MongoDB URI from environment or use a default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reaper:Rajesh123007@reaper.b6fszir.mongodb.net/meditech?retryWrites=true&w=majority&appName=reaper';

if (!process.env.MONGODB_URI) {
  console.log('⚠️  MONGODB_URI not set in environment variables. Using default connection string.');
  console.log('⚠️  For production, set MONGODB_URI in your environment variables.');
}

console.log('Connecting to MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs

// Make sure the URI points to meditech database
const finalURI = MONGODB_URI.includes('/meditech') ? 
  MONGODB_URI : 
  MONGODB_URI.replace(/\/([^/?]*)(\?|$)/, '/meditech$2');

const PORT = process.env.PORT || 5000;

mongoose.connect(finalURI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Please check your MONGODB_URI environment variable');
  console.error('If using MongoDB Atlas, make sure your IP is whitelisted');
  process.exit(1);
});