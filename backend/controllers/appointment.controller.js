const Appointment = require('../models/appointment.model');
const mongoose = require('mongoose');

// Get all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, doctorId, status, startDate, endDate } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }
    
    // Check if the requesting user is a doctor
    const requestingUser = req.user;
    const isRequestingUserDoctor = requestingUser && requestingUser.role === 'doctor';
    
    // If not a doctor, exclude all exclusive doctor appointments
    if (!isRequestingUserDoctor) {
      query.$and = [
        { ...query },
        {
          $or: [
            { isExclusiveAppointment: { $ne: true } },
            { isExclusiveAppointment: false },
            { isExclusiveAppointment: { $exists: false } }
          ]
        }
      ];
    } else {
      // If it's a doctor, only show their own exclusive appointments
      const doctorId = requestingUser.id || requestingUser._id;
      query.$and = [
        { ...query },
        {
          $or: [
            { isExclusiveAppointment: { $ne: true } },
            { isExclusiveAppointment: false },
            { isExclusiveAppointment: { $exists: false } },
            { 
              isExclusiveAppointment: true,
              doctorSpecialId: { $regex: new RegExp(doctorId, 'i') }
            }
          ]
        }
      ];
    }
    
    const appointments = await Appointment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: 1, time: 1 })
      .exec();
    
    const count = await Appointment.countDocuments(query);
    
    res.json({
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ message: 'Error retrieving appointments', error: error.message });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({ message: 'Error retrieving appointment', error: error.message });
  }
};

// Create new appointment
exports.createAppointment = async (req, res) => {
  try {
    // Override doctorId or patientId with logged in user's id if applicable, converting the ID to a string
    if (req.user && req.user.role === 'doctor') {
      req.body.doctorId = (req.user._id || req.user.id || req.user.userId).toString();
    }
    if (req.user && req.user.role === 'patient') {
      req.body.patientId = (req.user._id || req.user.id || req.user.userId).toString();
    }
    
    // If doctorId is a short code (like 'doc4'), map it to the real MongoDB _id
    if (req.body.doctorId && req.body.doctorId.startsWith('doc')) {
      const doctorUser = await mongoose.connection.db.collection('users')
        .findOne({ id: req.body.doctorId, role: 'doctor' });
      if (doctorUser && doctorUser._id) {
        req.body.doctorId = doctorUser._id.toString();
      }
    }
    
    // Check if there's already an appointment at this time
    const existingAppointment = await Appointment.findOne({
      doctorId: req.body.doctorId,
      date: req.body.date,
      time: req.body.time,
      status: { $ne: 'cancelled' }  // Ignore cancelled appointments
    });
    
    if (existingAppointment) {
      return res.status(409).json({ 
        message: 'This time slot is already booked',
        appointment: existingAppointment
      });
    }
    
    // Get doctor name based on doctorId
    let doctorName = req.body.doctorName;
    if (!doctorName) {
      // Handle standard doctor IDs
      if (req.body.doctorId === 'doc1') doctorName = 'Dr. Jhon';
      else if (req.body.doctorId === 'doc2') doctorName = 'Dr. Jack';
      else if (req.body.doctorId === 'doc3') doctorName = 'Dr. Monk';
      else if (req.body.doctorId === 'doc4') doctorName = 'Dr. Rohan';
      else {
        // Try to look up doctor in database
        try {
          const doctorUser = await mongoose.connection.db.collection('users')
            .findOne({ 
              $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.body.doctorId) ? mongoose.Types.ObjectId(req.body.doctorId) : null },
                { id: req.body.doctorId }
              ],
              role: 'doctor'
            });
          
          if (doctorUser) {
            if (doctorUser.firstName && doctorUser.lastName) {
              doctorName = `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`;
            } else if (doctorUser.firstName) {
              doctorName = `Dr. ${doctorUser.firstName}`;
            } else if (doctorUser.name) {
              doctorName = doctorUser.name;
            } else {
              doctorName = 'Unknown Doctor';
            }
          } else {
            doctorName = 'Unknown Doctor';
          }
        } catch (err) {
          console.error('Error finding doctor:', err);
          doctorName = 'Unknown Doctor';
        }
      }
    }
    
    const appointment = new Appointment({
      doctorId: req.body.doctorId,
      doctorName: doctorName,
      patientId: req.body.patientId,
      patientName: req.body.patientName || 'Unknown Patient',
      date: req.body.date,
      time: req.body.time,
      status: req.body.status || 'scheduled',
      notes: req.body.notes || '',
      // Handle special exclusive doctor appointment fields
      isExclusiveAppointment: req.body.isExclusiveAppointment || false,
      doctorSpecialId: req.body.doctorSpecialId || null
    });
    
    const savedAppointment = await appointment.save();
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: savedAppointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // If date or time is being changed, check for conflicts
    if ((req.body.date && req.body.date !== appointment.date) || 
        (req.body.time && req.body.time !== appointment.time)) {
      
      const doctorId = req.body.doctorId || appointment.doctorId;
      const date = req.body.date || appointment.date;
      const time = req.body.time || appointment.time;
      
      const existingAppointment = await Appointment.findOne({
        doctorId: doctorId,
        date: date,
        time: time,
        _id: { $ne: req.params.id },
        status: { $ne: 'cancelled' }
      });
      
      if (existingAppointment) {
        return res.status(409).json({ 
          message: 'This time slot is already booked',
          appointment: existingAppointment
        });
      }
    }
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    if (!req.body.status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    // Check for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid appointment ID:', req.params.id);
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.error('Appointment not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Appointment not found' });
    }
    appointment.status = req.body.status;
    appointment.updatedAt = Date.now();
    if (req.body.notes) {
      appointment.notes = req.body.notes;
    }
    const updatedAppointment = await appointment.save();
    res.json({
      success: true,
      message: `Appointment status updated to "${req.body.status}"`,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Error updating appointment status', error: error.message, stack: error.stack });
  }
};

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment', error: error.message });
  }
};

// Get appointments by patient
exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { patientId: patientId };
    if (status) query.status = status;
    
    const appointments = await Appointment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: 1, time: 1 })
      .populate('doctorId', 'firstName lastName')
      .exec();
    
    const count = await Appointment.countDocuments(query);
    
    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving patient appointments', 
      error: error.message 
    });
  }
};

// Get appointments by doctor
exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date } = req.query;
    
    console.log('Getting appointments for doctor:', doctorId);
    console.log('Request user:', req.user);
    console.log('Query parameters:', { status, date });
    
    // Build the query
    const query = {};
    
    if (status) query.status = status;
    if (date) query.date = date;
    
    // Simple query: get appointments where doctorId matches OR it's an exclusive appointment for this doctor
    query.$or = [
      { doctorId: doctorId },
      { 
        isExclusiveAppointment: true,
        doctorSpecialId: { $regex: new RegExp(doctorId, 'i') }
      }
    ];
    
    console.log('Final query:', JSON.stringify(query));
    
    // Get the appointments
    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    console.log(`Found ${appointments.length} appointments for doctor ${doctorId}`);
    
    // Log the first few appointments for debugging
    if (appointments.length > 0) {
      console.log('Sample appointments:', appointments.slice(0, 3).map(app => ({
        _id: app._id,
        doctorId: app.doctorId,
        patientId: app.patientId,
        isExclusiveAppointment: app.isExclusiveAppointment,
        doctorSpecialId: app.doctorSpecialId,
        date: app.date,
        time: app.time
      })));
    } else {
      console.log('No appointments found. Checking if there are any appointments in the database...');
      const totalAppointments = await Appointment.countDocuments({});
      console.log(`Total appointments in database: ${totalAppointments}`);
      
      // Check for any appointments with this doctorId
      const doctorAppointments = await Appointment.find({ doctorId: doctorId });
      console.log(`Appointments with doctorId ${doctorId}: ${doctorAppointments.length}`);
      
      // Check for any exclusive appointments
      const exclusiveAppointments = await Appointment.find({ isExclusiveAppointment: true });
      console.log(`Total exclusive appointments: ${exclusiveAppointments.length}`);
    }
    
    // Enhance appointments with patient information from database
    const enhancedAppointments = await Promise.all(
      appointments.map(async (app) => {
        const appObj = app.toObject();
        
        // Try to get better patient information if patientId exists
        if (appObj.patientId) {
          try {
            // Check users collection first
            const patientUser = await mongoose.connection.db.collection('users')
              .findOne({ 
                $or: [
                  { _id: mongoose.Types.ObjectId.isValid(appObj.patientId) ? mongoose.Types.ObjectId(appObj.patientId) : null },
                  { id: appObj.patientId }
                ]
              });
            
            if (patientUser) {
              console.log(`Found patient in users collection: ${patientUser.firstName} ${patientUser.lastName}`);
              appObj.patientDetails = {
                firstName: patientUser.firstName || '',
                lastName: patientUser.lastName || '',
                email: patientUser.email || '',
                name: patientUser.name || `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim()
              };
              
              // Update the patientName if it's unknown or missing
              if (!appObj.patientName || appObj.patientName === 'Unknown Patient') {
                if (appObj.patientDetails.name) {
                  appObj.patientName = appObj.patientDetails.name;
                } else if (patientUser.firstName && patientUser.lastName) {
                  appObj.patientName = `${patientUser.firstName} ${patientUser.lastName}`;
                } else if (patientUser.email) {
                  appObj.patientName = patientUser.email;
                }
              }
              return appObj;
            }
            
            // Try the patients collection as well
            const patientCollection = mongoose.connection.db.collection('patients');
            if (patientCollection) {
              const patient = await patientCollection.findOne(query);
              
              if (patient) {
                console.log(`Found patient in patients collection: ${patient.firstName} ${patient.lastName}`);
                appObj.patientDetails = {
                  firstName: patient.firstName || '',
                  lastName: patient.lastName || '',
                  email: patient.email || '',
                  name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
                };
                
                // Update the patientName if it's unknown or missing
                if (!appObj.patientName || appObj.patientName === 'Unknown Patient') {
                  if (appObj.patientDetails.name) {
                    appObj.patientName = appObj.patientDetails.name;
                  } else if (patient.firstName && patient.lastName) {
                    appObj.patientName = `${patient.firstName} ${patient.lastName}`;
                  } else if (patient.email) {
                    appObj.patientName = patient.email;
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching patient details for ${appObj.patientId}:`, err);
            // Keep the original appointment if there's an error
          }
        }
        
        return appObj;
      })
    );
    
    console.log(`Returning ${enhancedAppointments.length} enhanced appointments`);
    res.json(enhancedAppointments);
  } catch (error) {
    console.error('Error getting doctor appointments:', error);
    res.status(500).json({ message: 'Error retrieving doctor appointments', error: error.message });
  }
};

// Get available slots for a doctor on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, doctorId } = req.query;
    
    if (!date || !doctorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date and doctorId are required' 
      });
    }
    
    // Define available time slots (9 AM to 5 PM, 1-hour intervals)
    const availableSlots = [
      '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ];
    
    // Get booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId: doctorId,
      date: date,
      status: { $ne: 'cancelled' }
    });
    
    // Get booked times
    const bookedTimes = bookedAppointments.map(apt => apt.time);
    
    // Filter out booked slots
    const freeSlots = availableSlots.filter(slot => !bookedTimes.includes(slot));
    
    res.json({
      success: true,
      date: date,
      doctorId: doctorId,
      availableSlots: freeSlots,
      bookedSlots: bookedTimes
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving available slots', 
      error: error.message 
    });
  }
};

// Refresh patient information for an appointment
exports.refreshPatientInfo = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'firstName lastName email walletAddress')
      .populate('doctorId', 'firstName lastName email');
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    res.json({
          success: true,
        appointment: appointment 
      });
  } catch (error) {
    console.error('Error refreshing patient info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error refreshing patient info', 
      error: error.message 
    });
  }
}; 