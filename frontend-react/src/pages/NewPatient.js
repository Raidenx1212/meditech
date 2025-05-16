import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
  Avatar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Bloodtype as BloodtypeIcon,
  Healing as HealingIcon,
  LocalHospital as LocalHospitalIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  FilePresent as FileIcon
} from '@mui/icons-material';
import { PatientService, AuthService, MedicalRecordService } from '../services/api.service';
import axios from 'axios';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: '' }
];

const NewPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    contactNumber: '',
    address: '',
    bloodType: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: ''
  });
  const [errors, setErrors] = useState({});
  const [medicalFiles, setMedicalFiles] = useState([]);

  // Check authentication and role on component mount
  useEffect(() => {
    // Verify user is authenticated
    if (!AuthService.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login...');
      // Save current path to return after login
      sessionStorage.setItem('redirect_after_login', '/patients/new');
      // Redirect to login
      navigate('/login');
      return;
    }

    // Check if user is a patient
    if (!AuthService.isPatient()) {
      console.warn('User is not a patient, access denied');
      setError('Only patients can register new patients. Access denied.');
      // Redirect after showing the error
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing again
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error message
    if (error) {
      setError('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setMedicalFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index) => {
    setMedicalFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    const requiredFields = {
      firstName: 'First name',
      lastName: 'Last name',
      dateOfBirth: 'Date of birth',
      gender: 'Gender',
      contactNumber: 'Contact number',
      address: 'Address',
      bloodType: 'Blood type'
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${label} is required`;
      }
    });
    
    // Date of birth validation
    if (formData.dateOfBirth) {
      const dobDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dobDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    // Email validation
    if (formData.email) {
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }
    
    // Contact number validation
    if (formData.contactNumber) {
      if (!/^\+?[\d\s-]{10,}$/.test(formData.contactNumber)) {
        newErrors.contactNumber = 'Invalid contact number format';
      }
    }
    
    // Emergency contact validation
    if (formData.emergencyContactName && !formData.emergencyContactPhone) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required when name is provided';
    }
    
    if (formData.emergencyContactPhone && !formData.emergencyContactName) {
      newErrors.emergencyContactName = 'Emergency contact name is required when phone is provided';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-check authentication before submit
    if (!AuthService.isAuthenticated()) {
      setError('Your session has expired. Please login again.');
      setTimeout(() => {
        // Save current path to return after login
        sessionStorage.setItem('redirect_after_login', '/patients/new');
        navigate('/login');
      }, 1500);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setErrors({});
    
    try {
      // Check file sizes before attempting to submit
      if (medicalFiles.length > 0) {
        const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total limit
        const MAX_FILE_SIZE = 5 * 1024 * 1024;   // 5MB per file limit
        
        let totalSize = 0;
        const oversizedFiles = [];
        
        for (const file of medicalFiles) {
          if (file.size > MAX_FILE_SIZE) {
            oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          }
          totalSize += file.size;
        }
        
        if (oversizedFiles.length > 0) {
          setError(`Some files exceed the 5MB size limit: ${oversizedFiles.join(', ')}`);
          setLoading(false);
          return;
        }
        
        if (totalSize > MAX_TOTAL_SIZE) {
          setError(`Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds the 20MB limit`);
          setLoading(false);
          return;
        }
      }
      
      // Test backend connectivity before attempting to create patient
      try {
        const testResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/health`, {
          timeout: 3000
        });
        console.log('Backend connectivity test:', testResponse.status === 200 ? 'SUCCESS' : 'FAILED');
      } catch (connError) {
        console.error('Backend connectivity test failed:', connError.message);
        setError('Cannot connect to the backend server. Please check your network connection and try again.');
        setLoading(false);
        return;
      }
      
      const patientData = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone
        },
        status: 'active',
        registrationDate: new Date().toISOString().split('T')[0]
      };
      
      console.log('Creating patient...');
      
      // Use direct axios call to check for network issues
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }
      
      try {
        const directResponse = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/patients`, 
          patientData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        console.log('Direct API response:', directResponse.data);
        
        // If direct call succeeded, continue with normal flow using the response
        const response = { data: directResponse.data };
      
      if (response.data?.success) {
          // If there are medical records to upload, do that after patient creation
          if (medicalFiles.length > 0) {
            const patientId = response.data.patient?._id || response.data.patient?.id;
            
            if (!patientId) {
              console.error('Patient created but ID not found in response', response.data);
              setSuccess(true);
              setError('Patient created successfully, but there was an issue with the patient ID. Medical records could not be uploaded.');
              setTimeout(() => {
                navigate('/patients');
              }, 2500);
              return;
            }
            
            console.log(`Patient created with ID: ${patientId}, now uploading ${medicalFiles.length} medical records`);
            
            try {
              // Create a medical record for each file with a delay between uploads to prevent overloading
              let uploadErrorCount = 0;
              let uploadSuccessCount = 0;
              
              // Process files sequentially instead of all at once
              for (let i = 0; i < medicalFiles.length; i++) {
                const file = medicalFiles[i];
                setError(`Uploading file ${i + 1} of ${medicalFiles.length}: ${file.name}...`);
                
                const medicalRecordData = {
                  patientId: patientId,
                  type: 'Other',
                  date: new Date().toISOString().split('T')[0],
                  doctor: 'Previous Record',
                  details: `Previous medical record: ${file.name}`,
                  department: 'External',
                  status: 'Completed',
                  notes: 'Uploaded during patient registration'
                };
                
                try {
                  const result = await MedicalRecordService.createMedicalRecord(medicalRecordData, [file]);
                  
                  if (result.success) {
                    uploadSuccessCount++;
                  } else {
                    uploadErrorCount++;
                    console.error(`Error uploading record ${i + 1}: ${result.message}`);
                  }
                  
                  // Add a small delay between uploads
                  if (i < medicalFiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                } catch (uploadErr) {
                  uploadErrorCount++;
                  console.error(`Exception uploading record ${i + 1}:`, uploadErr);
                }
              }
              
              setSuccess(true);
              if (uploadErrorCount > 0) {
                if (uploadSuccessCount > 0) {
                  setError(`Patient created successfully with ${uploadSuccessCount} records uploaded, but ${uploadErrorCount} record(s) failed to upload.`);
                } else {
                  setError('Patient created successfully, but there was an issue uploading the medical records.');
                }
              } else {
                setError('');
              }
              
              setTimeout(() => {
                navigate('/patients');
              }, 2000);
            } catch (fileError) {
              console.error('Error in medical records upload process:', fileError);
              // Still consider the patient creation successful even if file upload fails
              setSuccess(true);
              setError('Patient created successfully, but there was an issue uploading medical records.');
              setTimeout(() => {
                navigate('/patients');
              }, 2500);
            }
          } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/patients');
        }, 1500);
          }
      } else {
          // This case is for API responses with success: false
        throw new Error(response.data?.message || 'Failed to create patient');
        }
      } catch (apiError) {
        if (apiError.response) {
          console.error('API Error Response:', apiError.response.status, apiError.response.data);
          throw apiError;
        } else if (apiError.request) {
          console.error('No response received from server:', apiError.request);
          setError('No response received from server. The server might be down or unreachable.');
        } else {
          console.error('Error setting up the request:', apiError.message);
          throw apiError;
        }
      }
    } catch (err) {
      console.error('Error creating patient:', err);
      
      // Enhanced error logging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        console.error('Response data:', err.response.data);
      }
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          // Save current path to return after login
          sessionStorage.setItem('redirect_after_login', '/patients/new');
          navigate('/login');
        }, 1500);
      }
      // Handle duplicate email error
      else if (err.response?.status === 409) {
        setErrors(prev => ({
          ...prev,
          email: err.response.data.message
        }));
        setError('A patient with this email already exists. Please use a different email.');
      }
      // Handle validation errors
      else if (err.response?.status === 400 && err.response.data?.errors) {
        const validationErrors = {};
        err.response.data.errors.forEach(error => {
          const field = error.toLowerCase().split(' ')[0];
          validationErrors[field] = error;
        });
        setErrors(prev => ({
          ...prev,
          ...validationErrors
        }));
        setError('Please check the form for errors.');
      }
      // Handle network errors
      else if (err.message && (err.message.includes('Network Error') || err.message.includes('timeout'))) {
        setError('Network error. Please check your internet connection and try again.');
      }
      // Handle other errors
      else {
        setError(err.response?.data?.message || 'Failed to create patient. Please try again.');
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const cardStyle = {
    borderRadius: 2,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(0,0,0,0.05)',
    '&:hover': {
      boxShadow: '0 12px 28px rgba(0,0,0,0.15)'
    }
  };
  
  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      transition: 'all 0.3s ease',
      '&:hover': {
        background: 'rgba(0,0,0,0.01)'
      },
      '& fieldset': {
        borderWidth: '1.5px',
        borderColor: 'rgba(0,0,0,0.15)'
      },
      '&:hover fieldset': {
        borderColor: '#3f51b5'
      },
      '&.Mui-focused fieldset': {
        borderWidth: '2px',
        borderColor: '#3f51b5'
      }
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500
    }
  };
  
  const sectionHeadingStyle = {
    fontWeight: 600,
    color: '#2c3e50',
    position: 'relative',
    '&:after': {
      content: '""',
      position: 'absolute',
      width: '40px',
      height: '3px',
      background: '#3f51b5',
      left: 0,
      bottom: '-8px'
    }
  };

  if (success) {
    return (
      <Alert severity="success" sx={{ mt: 2 }}>
        Patient created successfully! Redirecting...
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto',
      p: { xs: 1, sm: 2 }
    }}>
      {/* Header */}
      <Box component={Paper} sx={{
        p: 2,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...cardStyle,
        background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            component={Link}
            to="/patients"
            sx={{ 
              mr: 2, 
              color: 'white',
              background: 'rgba(255,255,255,0.1)',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            Patient Self-Registration
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip 
          icon={<LocalHospitalIcon sx={{ color: 'white !important' }} />} 
            label="For Patients Only" 
          sx={{ 
            background: 'rgba(255,255,255,0.2)', 
            color: 'white',
            fontWeight: 500,
            borderRadius: 3,
            px: 1
          }} 
        />
          <Button
            component={Link}
            to="/diagnostics/connection"
            variant="outlined"
            size="small"
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Diagnostics
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            error.includes('Failed to create patient') ? (
              <Button 
                color="inherit" 
                size="small"
                component={Link}
                to="/diagnostics/connection"
              >
                Run Diagnostics
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      )}

      {/* Information Alert */}
      <Alert 
        severity="info" 
        sx={{ mb: 3 }}
      >
        This form is for patient self-registration only. Doctors and medical staff cannot register new patients. Patients must complete their own registration.
      </Alert>

      {/* Main Form */}
      <Box component={Paper} sx={{ p: 0, ...cardStyle }}>
        {/* Personal Information Section */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #f5f7ff 0%, #eef1f8 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: '#3f51b5', 
              mr: 2,
              width: 40,
              height: 40
            }}>
              <PersonIcon />
            </Avatar>
            <Typography variant="h6" sx={sectionHeadingStyle}>
              Personal Information
            </Typography>
          </Box>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 3,
              mb: 4
            }}>
              {/* First Column */}
              <Box sx={{ 
                flex: 1, 
                minWidth: { xs: '100%', md: '45%' },
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5
              }}>
                <TextField
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: (
                      <PersonIcon sx={{ color: '#3f51b5', mr: 1 }} />
                    )
                  }}
                />

                <TextField
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  fullWidth
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                  sx={inputStyle}
                />
                
                <TextField
                  id="contactNumber"
                  name="contactNumber"
                  label="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  fullWidth
                  error={!!errors.contactNumber}
                  helperText={errors.contactNumber}
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: (
                      <PhoneIcon sx={{ color: '#3f51b5', mr: 1 }} />
                    )
                  }}
                />

                <TextField
                  id="address"
                  name="address"
                  label="Address"
                  value={formData.address}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  fullWidth
                  error={!!errors.address}
                  helperText={errors.address}
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: (
                      <HomeIcon sx={{ color: '#3f51b5', mr: 1 }} />
                    )
                  }}
                />
              </Box>

              {/* Second Column */}
              <Box sx={{ 
                flex: 1, 
                minWidth: { xs: '100%', md: '45%' },
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5
              }}>
                <TextField
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={inputStyle}
                  InputProps={{
                    startAdornment: (
                      <PersonIcon sx={{ color: '#3f51b5', mr: 1 }} />
                    )
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl 
                    variant="outlined" 
                    required
                    error={!!errors.gender}
                    sx={{ 
                      width: '40%',
                      ...inputStyle
                    }}
                  >
                    <InputLabel id="gender-label">Gender</InputLabel>
                    <Select
                      labelId="gender-label"
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      label="Gender"
                    >
                      {genderOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    id="email"
                    name="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleChange}
                    variant="outlined"
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={{ flexGrow: 1, ...inputStyle }}
                    InputProps={{
                      startAdornment: (
                        <EmailIcon sx={{ color: '#3f51b5', mr: 1 }} />
                      )
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl 
                    variant="outlined" 
                    required
                    error={!!errors.bloodType}
                    sx={{ 
                      width: '40%',
                      ...inputStyle
                    }}
                  >
                    <InputLabel id="bloodType-label">Blood Type</InputLabel>
                    <Select
                      labelId="bloodType-label"
                      id="bloodType"
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      label="Blood Type"
                      startAdornment={
                        <BloodtypeIcon sx={{ color: '#f44336', mr: 1 }} />
                      }
                    >
                      {bloodTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    id="allergies"
                    name="allergies"
                    label="Allergies (comma separated)"
                    value={formData.allergies}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{ flexGrow: 1, ...inputStyle }}
                    InputProps={{
                      startAdornment: (
                        <HealingIcon sx={{ color: '#f44336', mr: 1 }} />
                      )
                    }}
                  />
                </Box>
              </Box>
            </Box>
            
            {/* Emergency Contact Section */}
            <Box sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #f5f7ff 0%, #eef1f8 100%)',
              borderRadius: 2,
              mb: 3,
              mt: 2,
              borderLeft: '4px solid #3f51b5'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: '#3f51b5', 
                  mr: 2,
                  width: 40,
                  height: 40
                }}>
                  <PhoneIcon />
                </Avatar>
                <Typography variant="h6" sx={sectionHeadingStyle}>
                  Emergency Contact
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2.5,
                mt: 3
              }}>
                <TextField
                  id="emergencyContactName"
                  name="emergencyContactName"
                  label="Name"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  variant="outlined"
                  error={!!errors.emergencyContactName}
                  helperText={errors.emergencyContactName}
                  sx={{ flex: 1, minWidth: { xs: '100%', sm: '30%' }, ...inputStyle }}
                />

                <TextField
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  label="Relationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{ flex: 1, minWidth: { xs: '100%', sm: '30%' }, ...inputStyle }}
                />

                <TextField
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  label="Phone Number"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  variant="outlined"
                  error={!!errors.emergencyContactPhone}
                  helperText={errors.emergencyContactPhone}
                  sx={{ flex: 1, minWidth: { xs: '100%', sm: '30%' }, ...inputStyle }}
                  InputProps={{
                    startAdornment: (
                      <PhoneIcon sx={{ color: '#3f51b5', mr: 1 }} />
                    )
                  }}
                />
              </Box>
            </Box>

            {/* Previous Medical Records Section */}
            <Box sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #f5f7ff 0%, #eef1f8 100%)',
              borderRadius: 2,
              mb: 3,
              mt: 4,
              borderLeft: '4px solid #4caf50'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: '#4caf50', 
                  mr: 2,
                  width: 40,
                  height: 40
                }}>
                  <FileIcon />
                </Avatar>
                <Typography variant="h6" sx={sectionHeadingStyle}>
                  Previous Medical Records
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                If you have any previous medical records, please upload them here. The records will be stored securely and made accessible to your doctor for review.
              </Typography>

              <Box sx={{ 
                p: 3, 
                border: '2px dashed rgba(76, 175, 80, 0.3)',
                borderRadius: 2,
                backgroundColor: 'rgba(76, 175, 80, 0.05)',
                textAlign: 'center'
              }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFileIcon />}
                  sx={{ 
                    mb: 2,
                    bgcolor: 'white',
                    color: '#4caf50',
                    borderColor: '#4caf50',
                    '&:hover': {
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      borderColor: '#388e3c'
                    }
                  }}
                >
                  Upload Medical Records
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt"
                  />
                </Button>

                {medicalFiles.length > 0 && (
                  <List sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 1,
                    mt: 2,
                    border: '1px solid rgba(76, 175, 80, 0.2)'
                  }}>
                    {medicalFiles.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024).toFixed(2)} KB`}
                          sx={{ 
                            '& .MuiListItemText-primary': { 
                              color: '#4caf50',
                              fontWeight: 500
                            }
                          }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleRemoveFile(index)}
                            sx={{ color: '#f44336' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>

            {/* Form Actions */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2,
              mt: 4
            }}>
              <Button
                variant="outlined"
                component={Link}
                to="/patients"
                disabled={loading}
                startIcon={<CancelIcon />}
                sx={{ 
                  borderRadius: 2,
                  borderWidth: '1.5px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                  boxShadow: '0 4px 12px rgba(63,81,181,0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(63,81,181,0.5)',
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Patient'}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default NewPatient; 