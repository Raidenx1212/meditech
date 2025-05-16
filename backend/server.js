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

mongoose.connect(finalURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err)); 