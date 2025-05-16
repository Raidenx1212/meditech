import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Snackbar, 
  Alert, 
  TextField, 
  MenuItem, 
  Divider, 
  Grid, 
  Paper, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  InputAdornment,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { EventAvailable, AccessTime, Person, CalendarMonth, Cancel } from '@mui/icons-material';
import { AppointmentService } from '../services/api.service';
import socketService from '../services/socket.service';

const timeSlots = [
  '09:00 AM', 
  '10:00 AM', 
  '11:00 AM', 
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM'
];

const doctors = [
  { id: '682506236856a6bd9bea1a3e', name: 'Dr. Rohan' },
  { id: '6820fd7e38d3faf3be4c96c0', name: 'Dr. John' },
  { id: '6820fdef38d3faf3be4c96d0', name: 'Dr. Monk' },
  { id: '6827020f1244138c83873c7c', name: 'Dr. Suraj' },
  // Add other doctors here with their real MongoDB _id if available
];

const BookAppointment = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [selectedDate, setSelectedDate] = useState("2024-06-05");
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0].id);
  const [selectedTime, setSelectedTime] = useState("09:00 AM");
  const [openDialog, setOpenDialog] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [userAppointments, setUserAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [appointmentTabValue, setAppointmentTabValue] = useState(0);
  
  // Initialize socket for real-time updates
  useEffect(() => {
    // Initialize socket connection
    socketService.init();
    
    // Set up listener for new appointments
    const newAppointmentListener = (data) => {
      setSnackbar({ 
        open: true, 
        message: `A new appointment was just booked with ${data.doctorName}`
      });
      
      // Refresh available slots
      fetchAvailableSlots();
    };
    
    // Set up listener for cancelled appointments
    const cancelledAppointmentListener = (data) => {
      setSnackbar({ 
        open: true, 
        message: `An appointment with ${data.doctorName} was cancelled and is now available`
      });
      
      // Refresh available slots
      fetchAvailableSlots();
    };
    
    // Add event listeners
    socketService.addEventListener('new_appointment', newAppointmentListener);
    socketService.addEventListener('appointment_cancelled', cancelledAppointmentListener);
    
    // Subscribe to appointment updates
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    if (userInfo && userInfo.id) {
      socketService.subscribeToAppointments(userInfo.id, userInfo.role || 'patient');
    }
    
    // Initial fetch of available slots
    fetchAvailableSlots();
    
    // Cleanup listeners when component unmounts
    return () => {
      socketService.removeEventListener('new_appointment', newAppointmentListener);
      socketService.removeEventListener('appointment_cancelled', cancelledAppointmentListener);
    };
  }, []);
  
  // Fetch available slots when date or doctor changes
  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDate, selectedDoctor]);
  
  // Fetch available appointment slots from the backend
  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const doctorId = selectedDoctor;
      
      // Call the API without fallback to mock data
      const response = await AppointmentService.getAvailableSlots(doctorId, selectedDate);
      
      if (response && response.availableSlots) {
        setSlots(response.availableSlots.map((slot, index) => ({
          id: index + 1,
          doctor: getDoctorNameById(doctorId),
          date: selectedDate,
          time: slot.time,
          doctorId: doctorId
        })));
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Failed to load available appointment slots. Please try again.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get doctor name by ID
  const getDoctorNameById = (doctorId) => {
    // For debug purposes
    console.log('Looking up doctor with ID:', doctorId);
    
    const doctor = doctors.find(doc => doc.id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  // Helper to check for valid ObjectId (24 hex chars)
  const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

  // Helper to get the most accurate patient name possible
  const getPatientName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.name) {
      return user.name;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else if (user.email) {
      return user.email.split('@')[0]; // Use the username part of email
    } else if (user.username) {
      return user.username;
    } else if (user.id || user._id) {
      return `Patient ${user.id || user._id}`;
    } else {
      return 'Patient';
    }
  };

  const handleBook = async (id) => {
    try {
      setLoading(true);
      const slot = slots.find(s => s.id === id);
      
      // Get full user info from localStorage
      let userInfo;
      try {
        userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Patient user info for appointment:', userInfo);
      } catch (e) {
        console.error('Error parsing user data:', e);
        userInfo = {};
      }
      
      // Create appointment data
      const appointmentData = {
        doctorId: selectedDoctor,
        doctorName: getDoctorNameById(selectedDoctor),
        patientId: userInfo.id || userInfo._id || 'patient1', // Fallback ID if user data is missing
        patientName: getPatientName(userInfo),
        date: slot.date,
        time: slot.time,
        status: 'scheduled'
      };
      
      console.log('Creating appointment with data:', appointmentData);
      
      // Book appointment through the API
      const response = await AppointmentService.createAppointment(appointmentData);
      
      // Only proceed if backend returns a real _id
      if (!response.appointment || !response.appointment._id) {
        setSnackbar({
          open: true,
          message: 'Failed to book appointment: No valid appointment ID returned from server.',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Create a complete appointment object
      const newAppointment = {
        id: response.appointment._id,
        _id: response.appointment._id,
        patientId: appointmentData.patientId,
        patientName: appointmentData.patientName,
        doctorId: appointmentData.doctorId,
        doctor: slot.doctor,
        date: appointmentData.date,
        time: appointmentData.time,
        status: appointmentData.status,
        createdAt: new Date().toISOString()
      };
      
      // Add only if valid ObjectId
      if (isValidObjectId(newAppointment._id)) {
        const updatedAppointments = [...userAppointments, newAppointment];
        setUserAppointments(updatedAppointments);
        categorizeAppointments(updatedAppointments);
      }
      
      // Update UI
      setSlots(slots.filter(s => s.id !== id));
      setSnackbar({ 
        open: true, 
        message: `Appointment scheduled with ${slot.doctor} on ${slot.date} at ${slot.time}. Awaiting doctor confirmation.` 
      });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setSnackbar({ 
          open: true, 
          message: 'This slot is already booked. Please change the time or date.',
          severity: 'error'
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: `Failed to book appointment: ${err.message || 'Unknown error'}`,
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCustomBook = async () => {
    // Close the dialog
    setOpenDialog(false);
    
    try {
      setLoading(true);
      
      // Get full user info from localStorage
      let userInfo;
      try {
        userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Patient user info for appointment:', userInfo);
      } catch (e) {
        console.error('Error parsing user data:', e);
        userInfo = {};
      }
      
      // Create appointment data
      const appointmentData = {
        doctorId: selectedDoctor,
        doctorName: getDoctorNameById(selectedDoctor),
        patientId: userInfo.id || userInfo._id || 'patient1', // Fallback ID if user data is missing
        patientName: getPatientName(userInfo),
        date: selectedDate,
        time: selectedTime,
        status: 'scheduled'
      };
      
      console.log('Creating appointment with data:', appointmentData);
      
      // Make the API call to book the appointment
      const response = await AppointmentService.createAppointment(appointmentData);
      
      // Only proceed if backend returns a real _id
      if (!response.appointment || !response.appointment._id) {
        setSnackbar({
          open: true,
          message: 'Failed to book appointment: No valid appointment ID returned from server.',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Create a complete appointment object
      const newAppointment = {
        id: response.appointment._id,
        _id: response.appointment._id,
        patientId: appointmentData.patientId,
        patientName: appointmentData.patientName,
        doctorId: appointmentData.doctorId,
        doctor: getDoctorNameById(appointmentData.doctorId),
        date: appointmentData.date,
        time: appointmentData.time,
        status: appointmentData.status,
        createdAt: new Date().toISOString()
      };
      
      // Add only if valid ObjectId
      if (isValidObjectId(newAppointment._id)) {
        const updatedAppointments = [...userAppointments, newAppointment];
        setUserAppointments(updatedAppointments);
        categorizeAppointments(updatedAppointments);
      }
      
      // Update the UI
      setSnackbar({ 
        open: true, 
        message: `Appointment successfully scheduled with ${getDoctorNameById(selectedDoctor)} on ${selectedDate} at ${selectedTime}. Awaiting doctor confirmation.` 
      });
      
      // Set booking confirmed state for UI feedback
      setBookingConfirmed(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setBookingConfirmed(false);
      }, 3000);
      
      // Refresh available slots
      fetchAvailableSlots();
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setSnackbar({ 
          open: true, 
          message: 'This slot is already booked. Please change the time or date.',
          severity: 'error'
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: `Failed to book appointment: ${err.message || 'Unknown error'}`,
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAppointments();
  }, []);

  const fetchUserAppointments = async () => {
    try {
      setLoading(true);
      
      // Get user info from localStorage with better error handling
      let userInfo;
      try {
        userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      } catch (e) {
        console.warn('Failed to parse user data from localStorage:', e);
        userInfo = {};
      }
      
      // Use a default patient ID if no user info is available
      const patientId = userInfo.id || 'patient1';
      console.log('Fetching appointments for patient:', patientId);
      
      // Call the API without fallback to mock data
      const response = await AppointmentService.getAppointmentsByPatient(patientId);
      
      // Process the appointments response
      const appointments = Array.isArray(response) ? response : 
                         (response && response.appointments ? response.appointments : []);
      
      // Map appointments to ensure 'id' is set to '_id' and filter out invalid ones
      const mappedAppointments = appointments
        .filter(app => isValidObjectId(app._id || app.id))
        .map(app => ({ ...app, id: app._id }));
      console.log('Fetched appointments from API:', mappedAppointments.length);
      setUserAppointments(mappedAppointments);
      categorizeAppointments(mappedAppointments);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      // Don't use mock data, just show an error and empty state
      setError('Failed to load your appointments. Please try again.');
      setUserAppointments([]);
      categorizeAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const categorizeAppointments = (appointments) => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    
    appointments.forEach(appointment => {
      // Robustly parse date and time as local time
      const [year, month, day] = appointment.date.split('-').map(Number);
      let [time, modifier] = appointment.time.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      const appointmentDate = new Date(year, month - 1, day, hours, minutes);
      if (appointmentDate > now) {
        upcoming.push(appointment);
      } else {
        past.push(appointment);
      }
    });
    
    // Sort upcoming appointments by date (closest first)
    upcoming.sort((a, b) => {
      const aDate = new Date(a.date + ' ' + a.time);
      const bDate = new Date(b.date + ' ' + b.time);
      return aDate - bDate;
    });
    
    // Sort past appointments by date (most recent first)
    past.sort((a, b) => {
      const aDate = new Date(a.date + ' ' + a.time);
      const bDate = new Date(b.date + ' ' + b.time);
      return bDate - aDate;
    });
    
    setUpcomingAppointments(upcoming);
    setPastAppointments(past);
  };

  const handleCancelAppointment = async (appointmentId) => {
    // Prevent cancellation if appointmentId is not a valid ObjectId
    if (!isValidObjectId(appointmentId)) {
      setSnackbar({
        open: true,
        message: 'Cannot cancel: Invalid appointment ID.',
        severity: 'error'
      });
      return;
    }
    try {
      setLoading(true);
      await AppointmentService.cancelAppointment(appointmentId);
      
      // Update local state after successful cancellation
      const updatedAppointments = userAppointments.map(app => 
        app.id === appointmentId ? { ...app, status: 'cancelled' } : app
      );
      
      setUserAppointments(updatedAppointments);
      categorizeAppointments(updatedAppointments);
      
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully',
        severity: 'success'
      });
      
      // Refresh available slots
      fetchAvailableSlots();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setSnackbar({
        open: true,
        message: `Failed to cancel appointment: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'medium', color: 'primary.main' }}>
        Book Appointment
      </Typography>
      
      {/* Main Booking Card */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 4 }, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to right bottom, #ffffff, #f9fbff)'
        }}
      >
        <Grid container spacing={3}>
          {/* Date Selection */}
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth
              label="Select Date" 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* Doctor Selection */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Select Doctor"
              value={selectedDoctor || ''}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="primary" />
                  </InputAdornment>
                ),
              }}
            >
              {doctors.map(doctor => (
                <MenuItem key={doctor.id} value={doctor.id}>{doctor.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          
          {/* Time Selection */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Select Time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTime color="primary" />
                  </InputAdornment>
                ),
              }}
            >
              {timeSlots.map(time => (
                <MenuItem key={time} value={time}>{time}</MenuItem>
              ))}
            </TextField>
          </Grid>
          
          {/* Book Button */}
          <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleOpenDialog}
              disabled={bookingConfirmed}
              startIcon={<EventAvailable />}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 2,
                boxShadow: 3,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 5
                }
              }}
            >
              {loading ? 'Processing...' : bookingConfirmed ? 'Appointment Scheduled!' : 'Schedule Appointment'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="confirm-appointment-dialog"
      >
        <DialogTitle id="confirm-appointment-dialog">
          Schedule Your Appointment
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to schedule an appointment with {getDoctorNameById(selectedDoctor)} on {selectedDate} at {selectedTime}.
            The appointment will be pending until confirmed by the doctor. You will be notified once your appointment is confirmed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCustomBook} color="primary" variant="contained" autoFocus>
            {loading ? 'Processing...' : 'Schedule Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Divider sx={{ my: 3 }} />
      
      {/* My Appointments Section */}
      <Box sx={{ mt: 6, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 'medium' }}>
          My Appointments
        </Typography>
        
        {/* Tabs for Upcoming and Past appointments */}
        <Box sx={{ mt: 2 }}>
          <Tabs 
            value={appointmentTabValue} 
            onChange={(e, newValue) => setAppointmentTabValue(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label={`Upcoming (${upcomingAppointments.length})`} />
            <Tab label={`Past (${pastAppointments.length})`} />
          </Tabs>

          {/* Upcoming Appointments */}
          {appointmentTabValue === 0 && (
            <Box>
              {upcomingAppointments.length > 0 ? (
                <List>
                  {upcomingAppointments.map(appointment => (
                    <ListItem
                      key={appointment.id}
                      component={Paper}
                      elevation={1}
                      sx={{
                        my: 1,
                        p: 2,
                        borderRadius: 1,
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                      }}
                      secondaryAction={
                        appointment.status !== 'cancelled' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Cancel />}
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            Cancel
                          </Button>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {appointment.doctor}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarMonth fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                              {appointment.date}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTime fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                              {appointment.time}
                            </Typography>
                            {appointment.status && (
                              <Chip 
                                size="small" 
                                label={appointment.status.toUpperCase()}
                                color={appointment.status === 'confirmed' ? 'success' : 
                                       appointment.status === 'scheduled' ? 'info' : 
                                       appointment.status === 'cancelled' ? 'error' : 'default'}
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No upcoming appointments found.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Past Appointments */}
          {appointmentTabValue === 1 && (
            <Box>
              {pastAppointments.length > 0 ? (
                <List>
                  {pastAppointments.map(appointment => (
                    <ListItem
                      key={appointment.id}
                      component={Paper}
                      elevation={1}
                      sx={{
                        my: 1,
                        p: 2,
                        borderRadius: 1,
                        borderLeft: '4px solid',
                        borderColor: 'text.disabled',
                        opacity: 0.8,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {appointment.doctor}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarMonth fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                              {appointment.date}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTime fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                              {appointment.time}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={appointment.status === 'completed' ? 'COMPLETED' : 'MISSED'}
                              color={appointment.status === 'completed' ? 'success' : 'warning'}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No past appointments found.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity || 'success'}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 3
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookAppointment; 