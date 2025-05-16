import React, { useState, useEffect } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, Chip, Button, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  IconButton, Tooltip
} from '@mui/material';
import { 
  Upload as UploadIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { AppointmentService, PatientService, AuthService } from '../services/api.service';
import { useNavigate } from 'react-router-dom';

const statusColor = {
  confirmed: 'success',
  scheduled: 'warning',
  cancelled: 'error',
  completed: 'info',
  missed: 'error',
};

// Icon to show for different status types
const statusIcon = {
  scheduled: '🔔',  // bell icon for pending/scheduled
};

const ViewAppointment = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [patientDetails, setPatientDetails] = useState({});
  
  // For document upload
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Get doctorId from localStorage with proper error handling
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('No user data found in localStorage');
        return null;
      }
      
      const user = JSON.parse(userStr);
      // Check for different ID formats
      const userId = user?._id || user?.id || user?.userId;
      
      if (!userId) {
        console.error('User found in localStorage but missing ID property:', user);
      }
      
      return user;
    } catch (err) {
      console.error('Error parsing user data from localStorage:', err);
      return null;
    }
  };
  
  const user = getUserData();
  const doctorId = user?._id || user?.id || user?.userId;
  
  // Fetch patient information for a given patient ID
  const fetchPatientDetails = async (patientId, patientName = null) => {
    // Use backup name from appointment if provided and not 'Unknown Patient'
    const backupName = patientName && patientName !== 'Unknown Patient' ? patientName : null;
    try {
      console.log(`Fetching patient details for ID: ${patientId}`);
      // Attempt fetching patient profile directly from MongoDB
      const response = await PatientService.getPatientById(patientId);
      if (response && response.data && response.data.patient) {
        const patient = response.data.patient;
        // Construct full name using firstName and lastName fields
        const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
        if (fullName) {
          return {
            name: fullName,
            id: patientId,
            email: patient.email,
            contactNumber: patient.contactNumber
          };
        }
      }
      // If no valid patient data is returned, use the backup name if available
      if (backupName) {
        console.log(`Using backup name from appointment for patient ${patientId}: ${backupName}`);
        return { name: backupName, id: patientId };
      }
      return { name: 'Unknown Patient', id: patientId };
    } catch (err) {
      console.error(`Error fetching details for patient ${patientId}:`, err);
      if (backupName) {
        return { name: backupName, id: patientId };
      }
      return { name: 'Unknown Patient', id: patientId };
    }
  };
  
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated
        if (!AuthService.isAuthenticated()) {
          setError('User not authenticated. Please login again.');
          setTimeout(() => {
            navigate('/login', { state: { successMessage: 'Please login to view appointments' } });
          }, 2000);
          return;
        }
        
        // Check if user is a doctor
        if (!AuthService.isDoctor()) {
          setError('Only doctors can view this page.');
          return;
        }
        
        // Check if doctorId exists
        if (!doctorId) {
          setError('Doctor ID not found. Please login again.');
          setSnackbar({
            open: true,
            message: 'Doctor ID not found in user profile. Please logout and login again.',
            severity: 'error'
          });
          return;
        }
        
        console.log('Fetching appointments for doctor ID:', doctorId);
        
        // Check if this is Dr. Rohan and we need to look up both IDs
        const isRohan = user?.firstName === 'Rohan' || 
                       user?.name?.includes('Rohan') || 
                       localStorage.getItem('rohan_doctor_id') === doctorId;
        
        let appointments = [];
        
        // Fetch doctor's appointments
        try {
          console.log(`Attempting to fetch appointments for doctor with ID: ${doctorId}`);
          
          // Make sure the doctorId is valid
          if (!doctorId) {
            setError('Doctor ID is missing. Please login again.');
            console.error('Error: Trying to fetch appointments but doctorId is missing');
            return;
          }
          
          // Call the appropriate method for doctor appointments
          const response = await AppointmentService.getAppointmentsByDoctor(doctorId);
          console.log('Appointments response received:', response);
          
          // Format and parse the appointments
          const fetchedAppointments = Array.isArray(response) ? response : 
                                     (response.appointments || []);
          appointments = [...fetchedAppointments];
          
          // If this is Dr. Rohan, also check for appointments with doc4 if doctorId is a MongoDB ID
          if (isRohan && doctorId !== 'doc4') {
            console.log('This appears to be Dr. Rohan. Checking for appointments with doc4 ID');
            try {
              const altResponse = await AppointmentService.getAppointmentsByDoctor('doc4');
              if (altResponse) {
                const altAppointments = Array.isArray(altResponse) ? altResponse : 
                                     (altResponse.appointments || []);
                console.log('Found additional appointments with doc4 ID:', altAppointments.length);
                
                // Combine appointments, avoiding duplicates
                const existingIds = new Set(appointments.map(app => app._id));
                for (const app of altAppointments) {
                  if (!existingIds.has(app._id)) {
                    appointments.push(app);
                  }
                }
              }
            } catch (altErr) {
              console.log('No additional appointments found with doc4 ID');
            }
          }
        } catch (fetchErr) {
          console.error('Error fetching appointments for doctor ID:', doctorId, fetchErr);
          
          let errorMessage = `Failed to load appointments for doctor: ${doctorId}`;
          
          // Add more detailed error message based on error type
          if (fetchErr.response) {
            if (fetchErr.response.status === 403) {
              errorMessage = `Access denied: You can only view your own appointments. Your user ID doesn't match the doctor ID ${doctorId}`;
            } else if (fetchErr.response.status === 404) {
              errorMessage = `The appointments endpoint doesn't exist or wasn't found`;
            } else if (fetchErr.response.status === 401) {
              errorMessage = `Authentication error: Your session may have expired`;
            }
          } else if (!fetchErr.response && fetchErr.message) {
            if (fetchErr.message.includes('Network Error')) {
              errorMessage = 'Network error: Unable to connect to the appointments server';
            }
          }
          
          setError(errorMessage);
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'error'
          });
          return;
        }
        
        console.log('Total appointments found:', appointments.length);
                                    
        // Sort appointments (most recent first)
        appointments.sort((a, b) => 
          new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        );
        
        setAppointments(appointments);
        
        // Fetch patient details for each appointment from MongoDB
        const patientDetailsMap = {};
        
        // Process each appointment with proper MongoDB patient information
        for (const app of appointments) {
          if (app.patientName && app.patientName !== 'Unknown Patient' && app.patientDetails) {
            patientDetailsMap[app.patientId] = { 
              name: app.patientName,
              id: app.patientId,
              email: app.patientDetails?.email || '',
              contactNumber: app.patientDetails?.contactNumber || ''
            };
          } else {
            // For any appointment that still needs patient details, fetch from MongoDB
            try {
              const details = await fetchPatientDetails(app.patientId, app.patientName);
              patientDetailsMap[app.patientId] = details;
            } catch (err) {
              console.error(`Failed to fetch MongoDB details for patient ${app.patientId}:`, err);
              patientDetailsMap[app.patientId] = { 
                name: app.patientName || 'Unknown Patient',
                id: app.patientId
              };
            }
          }
        }
        
        setPatientDetails(patientDetailsMap);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again.');
        setSnackbar({
          open: true,
          message: 'Failed to load appointments.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [doctorId, navigate]);
  
  const handleCancel = async (id) => {
    try {
      await AppointmentService.cancelAppointment(id);
      
      // Update local state
    setAppointments(appointments.map(app =>
        app._id === id ? { ...app, status: 'cancelled' } : app
      ));
      
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully.',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setSnackbar({
        open: true,
        message: 'Failed to cancel appointment.',
        severity: 'error'
      });
    }
  };
  
  const handleConfirm = async (id) => {
    try {
      await AppointmentService.updateAppointment(id, { status: 'confirmed' });
      
      // Update local state
    setAppointments(appointments.map(app =>
        app._id === id ? { ...app, status: 'confirmed' } : app
      ));
      
      setSnackbar({
        open: true,
        message: 'Appointment confirmed successfully.',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error confirming appointment:', err);
      setSnackbar({
        open: true,
        message: 'Failed to confirm appointment.',
        severity: 'error'
      });
    }
  };
  
  // Document upload functions
  const handleOpenUploadDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setUploadDialogOpen(true);
    setUploadFile(null);
  };
  
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedAppointment(null);
    setUploadFile(null);
  };
  
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setUploadFile(event.target.files[0]);
    }
  };
  
  const handleUploadDocument = async () => {
    if (!uploadFile || !selectedAppointment) return;
    setUploading(true);
    try {
      // 1. Upload the file to /api/upload to get fileId
      const formData = new FormData();
      formData.append('file', uploadFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('File upload failed');
      const uploadData = await uploadRes.json();
      const fileId = uploadData.fileId;

      // 2. Create the medical doc (store fileId instead of fileUrl)
      const docRes = await fetch('/api/medical-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment._id,
          fileUrl: `/api/files/${fileId}`,
          description: uploadFile.name
        })
      });
      if (!docRes.ok) throw new Error('Failed to create medical document');
      
      setSnackbar({
        open: true,
        message: 'Document uploaded for patient approval.',
        severity: 'success'
      });
      handleCloseUploadDialog();
    } catch (err) {
      console.error('Error uploading document:', err);
      setSnackbar({
        open: true,
        message: 'Failed to upload document.',
        severity: 'error'
      });
    } finally {
      setUploading(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>View Appointments</Typography>
      
      {appointments.length === 0 ? (
        <Alert severity="info">No appointments found.</Alert>
      ) : (
      <List>
        {appointments.map(app => (
          <ListItem
              key={app._id}
            divider
            secondaryAction={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                    justifyContent: app.status === 'cancelled' ? 'center' : 'flex-start',
                  minWidth: 180
                }}
              >
                  <Chip 
                    label={`${statusIcon[app.status] || ''} ${app.status}`} 
                    color={statusColor[app.status] || 'default'} 
                  />
                  
                  {/* Upload document button */}
                  {(app.status === 'confirmed' || app.status === 'completed') && (
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenUploadDialog(app)}
                      title="Upload document for patient"
                    >
                      <UploadIcon />
                    </IconButton>
                  )}
                  
                  {app.status === 'scheduled' && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                      onClick={() => handleConfirm(app._id)}
                  >
                    Confirm
                  </Button>
                )}
                  
                  {app.status !== 'cancelled' && app.status !== 'completed' && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleCancel(app._id)}
                    >
                    Cancel
                  </Button>
                )}
              </Box>
            }
          >
            <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography variant="subtitle1">
                      Patient: {patientDetails[app.patientId]?.name || app.patientName || (app.patientDetails?.name) || app.patientId}
                    </Typography>
                    
                    {/* Show email if available */}
                    {(app.patientDetails?.email || patientDetails[app.patientId]?.email) && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {app.patientDetails?.email || patientDetails[app.patientId]?.email}
                      </Typography>
                    )}
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {`${app.date} at ${app.time}`}
                    </Typography>
                    <Typography component="span" variant="body2" display="block">
                      {`Status: ${app.status}`}
                    </Typography>
                    {app.status === 'scheduled' && (
                      <Typography component="span" variant="body2" color="warning.main" display="block">
                        Needs confirmation
                      </Typography>
                    )}
                  </React.Fragment>
                }
            />
          </ListItem>
        ))}
      </List>
      )}
      
      {/* Document Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>Upload Document for Patient</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            This document will be sent to the patient for approval before being added to their medical records.
          </Typography>
          <TextField
            type="file"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            onChange={handleFileChange}
            disabled={uploading}
            inputProps={{ accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>Cancel</Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained" 
            color="primary"
            disabled={!uploadFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewAppointment; 