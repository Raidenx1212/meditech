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
      notes: req.body.notes || ''
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
    const { status } = req.query;
    
    console.log('Getting appointments for patient:', patientId);
    
    const query = { patientId };
    if (status) query.status = status;
    
    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    console.log(`Found ${appointments.length} appointments for patient ${patientId}`);
    
    // Enhance appointments with doctor information if needed
    const enhancedAppointments = await Promise.all(
      appointments.map(async (app) => {
        const appObj = app.toObject();
        
        // Try to get better doctor information if doctorId exists and doctor name is missing
        if (appObj.doctorId && (!appObj.doctorName || appObj.doctorName === 'Unknown Doctor')) {
          try {
            // Check users collection for doctor info
            const doctorUser = await mongoose.connection.db.collection('users')
              .findOne({ 
                $or: [
                  { _id: mongoose.Types.ObjectId.isValid(appObj.doctorId) ? mongoose.Types.ObjectId(appObj.doctorId) : null },
                  { id: appObj.doctorId }
                ],
                role: 'doctor'
              });
            
            if (doctorUser) {
              console.log(`Found doctor in users collection: ${doctorUser.firstName} ${doctorUser.lastName}`);
              appObj.doctorDetails = {
                firstName: doctorUser.firstName || '',
                lastName: doctorUser.lastName || '',
                email: doctorUser.email || '',
                name: doctorUser.name || `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim()
              };
              
              // Map standard doctor IDs to names
              if (appObj.doctorId === 'doc1') appObj.doctorName = 'Dr. Jhon';
              else if (appObj.doctorId === 'doc2') appObj.doctorName = 'Dr. Jack';
              else if (appObj.doctorId === 'doc3') appObj.doctorName = 'Dr. Monk';
              else if (appObj.doctorId === 'doc4') appObj.doctorName = 'Dr. Rohan';
              // Or use the doctor info from database
              else if (appObj.doctorDetails.name) {
                appObj.doctorName = appObj.doctorDetails.name;
              } else if (doctorUser.firstName && doctorUser.lastName) {
                appObj.doctorName = `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`;
              } else if (doctorUser.firstName) {
                appObj.doctorName = `Dr. ${doctorUser.firstName}`;
              } else if (doctorUser.email) {
                appObj.doctorName = doctorUser.email;
              }
            }
          } catch (err) {
            console.error(`Error fetching doctor details for ${appObj.doctorId}:`, err);
            // Keep the original appointment if there's an error
          }
        }
        
        return appObj;
      })
    );
    
    res.json(enhancedAppointments);
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    res.status(500).json({ message: 'Error retrieving patient appointments', error: error.message });
  }
};

// Get appointments by doctor
exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date } = req.query;
    
    console.log('Getting appointments for doctor:', doctorId);
    
    // Check if this is a special case for Dr. Rohan
    const isRohanDoc4 = doctorId === 'doc4';
    
    // Build the query
    const query = {};
    
    if (status) query.status = status;
    if (date) query.date = date;
    
    // Handle special case for Dr. Rohan doc4 ID - we need to check both doc4 and mongoose ID
    if (isRohanDoc4) {
      console.log('Using special query for Dr. Rohan with doc4 ID');
      query['$or'] = [{ doctorId: 'doc4' }];
      
      // Check if there's a stored mapping in the database for Rohan's real ID
      const rohanUser = await mongoose.connection.db.collection('users')
        .findOne({ name: { $regex: 'Rohan', $options: 'i' } });
      
      if (rohanUser && rohanUser._id) {
        console.log('Found Dr. Rohan in user collection:', rohanUser._id.toString());
        query['$or'].push({ doctorId: rohanUser._id.toString() });
      }
    } else {
      query.doctorId = doctorId;
    }
    
    console.log('Final query:', JSON.stringify(query));
    
    // Get the appointments
    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 });
    console.log(`Found ${appointments.length} appointments for doctor ${doctorId}`);
    
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
              const patient = await patientCollection.findOne({
                $or: [
                  { _id: mongoose.Types.ObjectId.isValid(appObj.patientId) ? mongoose.Types.ObjectId(appObj.patientId) : null },
                  { id: appObj.patientId }
                ]
              });
              
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
    
    res.json(enhancedAppointments);
  } catch (error) {
    console.error('Error getting doctor appointments:', error);
    res.status(500).json({ message: 'Error retrieving doctor appointments', error: error.message });
  }
};

// Get available slots for a doctor on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }
    
    // Find all booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $ne: 'cancelled' }
    }).select('time');
    
    // Define all possible time slots
    const allTimeSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];
    
    // Filter out booked slots
    const bookedTimes = bookedAppointments.map(app => app.time);
    const availableSlots = allTimeSlots
      .filter(time => !bookedTimes.includes(time))
      .map(time => ({ time }));
    
    res.json({
      success: true,
      date,
      doctorId,
      availableSlots
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ message: 'Error retrieving available slots', error: error.message });
  }
};

// Refresh patient information for an appointment
exports.refreshPatientInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Received refresh request for appointment ID:', id);
    
    // Check for valid ID
    if (!id) {
      console.error('No appointment ID provided');
      return res.status(400).json({ 
        success: false, 
        message: 'No appointment ID provided' 
      });
    }
    
    // Check if it's a valid ObjectId
    let isValidObjectId = false;
    try {
      isValidObjectId = mongoose.Types.ObjectId.isValid(id);
      console.log(`ID ${id} is ${isValidObjectId ? 'a valid' : 'not a valid'} ObjectId`);
    } catch (idError) {
      console.error('Error validating ObjectId:', idError);
      isValidObjectId = false;
    }
    
    if (!isValidObjectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid appointment ID format' 
      });
    }
    
    // Find the appointment
    let appointment;
    try {
      appointment = await Appointment.findById(id);
      console.log('Found appointment:', appointment ? 'yes' : 'no');
    } catch (findError) {
      console.error('Error finding appointment:', findError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error finding appointment',
        error: findError.message
      });
    }
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    // If no patient ID, can't proceed
    if (!appointment.patientId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment does not have a patient ID' 
      });
    }
    
    console.log(`Refreshing patient info for appointment ${id}, patient ${appointment.patientId}`);
    
    // Try to find patient in users collection
    let patientName = 'Unknown Patient';
    let patientDetails = null;
    
    // Try users collection first
    try {
      // Check if the patient ID could be a valid ObjectId
      let patientObjectId = null;
      try {
        if (mongoose.Types.ObjectId.isValid(appointment.patientId)) {
          patientObjectId = new mongoose.Types.ObjectId(appointment.patientId);
          console.log('Patient ID is a valid ObjectId:', patientObjectId);
        } else {
          console.log('Patient ID is not a valid ObjectId:', appointment.patientId);
        }
      } catch (err) {
        console.log('Error converting patient ID to ObjectId:', err);
      }
      
      // Build a query that works with both string IDs and ObjectIds
      const query = { $or: [] };
      
      // Always search by the string ID
      query.$or.push({ id: appointment.patientId });
      
      // If we have a valid ObjectId, add that to the query
      if (patientObjectId) {
        query.$or.push({ _id: patientObjectId });
      }
      
      console.log('Searching users collection with query:', JSON.stringify(query));
      
      const patientUser = await mongoose.connection.db.collection('users').findOne(query);
      
      if (patientUser) {
        console.log(`Found patient in users collection:`, patientUser);
        patientDetails = {
          firstName: patientUser.firstName || '',
          lastName: patientUser.lastName || '',
          email: patientUser.email || '',
          name: patientUser.name || `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim()
        };
        
        // Get the best name possible
        if (patientUser.firstName && patientUser.lastName) {
          patientName = `${patientUser.firstName} ${patientUser.lastName}`;
        } else if (patientUser.name) {
          patientName = patientUser.name;
        } else if (patientUser.firstName) {
          patientName = patientUser.firstName;
        } else if (patientUser.email) {
          patientName = patientUser.email;
        }
      } else {
        console.log('Patient not found in users collection, trying patients collection');
        
        // Try the patients collection
        try {
          const patientCollection = mongoose.connection.db.collection('patients');
          if (patientCollection) {
            const patient = await patientCollection.findOne(query);
            
            if (patient) {
              console.log(`Found patient in patients collection:`, patient);
              patientDetails = {
                firstName: patient.firstName || '',
                lastName: patient.lastName || '',
                email: patient.email || '',
                name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
              };
              
              // Get the best name possible
              if (patient.firstName && patient.lastName) {
                patientName = `${patient.firstName} ${patient.lastName}`;
              } else if (patient.name) {
                patientName = patient.name;
              } else if (patient.firstName) {
                patientName = patient.firstName;
              } else if (patient.email) {
                patientName = patient.email;
              }
            } else {
              console.log('Patient not found in patients collection');
            }
          } else {
            console.log('Patients collection does not exist');
          }
        } catch (patientErr) {
          console.error(`Error looking up patient in patients collection:`, patientErr);
        }
      }
    } catch (err) {
      console.error(`Error looking up patient ${appointment.patientId}:`, err);
      // Continue with default 'Unknown Patient'
    }
    
    console.log('Final patient name determined:', patientName);
    
    // If we found patient info, update the appointment
    if (patientName !== 'Unknown Patient') {
      try {
        appointment.patientName = patientName;
        appointment.patientDetails = patientDetails;
        const savedAppointment = await appointment.save();
        console.log('Successfully updated appointment with patient info');
        
        return res.json({
          success: true,
          message: 'Patient information updated successfully',
          appointment: savedAppointment
        });
      } catch (saveErr) {
        console.error('Error saving appointment:', saveErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Error saving updated appointment',
          error: saveErr.message 
        });
      }
    } else {
      console.log('No patient information found, returning original appointment');
      return res.status(404).json({ 
        success: false, 
        message: 'Could not find patient information in the database',
        appointment: appointment 
      });
    }
  } catch (error) {
    console.error('Unhandled error refreshing patient information:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while refreshing patient information',
      error: error.message 
    });
  }
}; 