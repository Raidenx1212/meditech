import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon, LocalHospital } from '@mui/icons-material';
import { MedicalRecordService } from '../services/api.service';

const recordTypes = [
  'Diagnosis',
  'Medication',
  'Procedure',
  'Lab Test',
  'Vaccination',
  'Other'
];

const statusOptions = [
  'Active',
  'Completed',
  'Scheduled',
  'Cancelled'
];

const AddMedicalRecordForm = ({ patientId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    type: '',
    date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
    doctor: '',
    details: '',
    department: '',
    status: 'Active',
    notes: '',
    instructions: '',
    result: ''
  });
  
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.type || !formData.doctor || !formData.details) {
      setError('Please fill in all required fields (Type, Doctor, and Details)');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Create the record data object
      const recordData = {
        ...formData,
        patientId // Add patient ID to the record data
      };
      
      // Check if authenticated before proceeding
      if (!localStorage.getItem('token')) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login?session_expired=true';
        }, 2000);
        return;
      }

      console.log('Creating medical record...');
      
      // Call the service method to create the record
      const response = await MedicalRecordService.createMedicalRecord(recordData, files);
      
      if (response.success) {
        // If successful, call the onSuccess callback
        console.log('Record created successfully:', response.record);
        onSuccess();
      } else {
        console.error('Failed to create record:', response);
        
        if (response.message && response.message.includes('Authentication required')) {
          setError('Your session has expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login?session_expired=true';
          }, 2000);
        } else if (response.message && response.message.includes('files too large')) {
          setError('Files too large. Please reduce file size or upload fewer files.');
        } else {
          setError(response.message || 'Failed to create medical record. Please try again.');
        }
      }
    } catch (err) {
      console.error('Unexpected error creating medical record:', err);
      
      if (err.message && err.message.includes('Network Error')) {
        setError('Cannot connect to the server. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred while creating the medical record. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          bgcolor: '#1976d2', 
          color: 'white', 
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <LocalHospital />
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Add New Medical Record
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mx: 3, 
              mt: 3, 
              borderRadius: 2,
              '& .MuiAlert-message': { fontWeight: 500 }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ p: 3 }}>
            {/* Basic Information Section */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 500 }}>
                  Basic Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required variant="outlined">
                      <InputLabel id="record-type-label" sx={{ bgcolor: 'white', px: 1 }}>Record Type *</InputLabel>
                      <Select
                        labelId="record-type-label"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        label="Record Type *"
                        displayEmpty
                        sx={{
                          height: '56px',
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                            borderWidth: '1px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                            borderWidth: '2px',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                            borderWidth: '2px',
                          },
                          '& .MuiSelect-select': {
                            padding: '14px',
                            fontSize: '1rem',
                          }
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Select a Record Type</em>
                        </MenuItem>
                        {recordTypes.map((type) => (
                          <MenuItem 
                            key={type} 
                            value={type}
                            sx={{
                              '&:hover': {
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'rgba(25, 118, 210, 0.12)',
                                '&:hover': {
                                  bgcolor: 'rgba(25, 118, 210, 0.16)',
                                }
                              }
                            }}
                          >
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {!formData.type && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#d32f2f',
                            mt: 0.5,
                            ml: 2
                          }}
                        >
                          Please select a record type
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="date"
                      label="Date *"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Medical Details Section */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 500 }}>
                  Medical Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="doctor"
                      label="Doctor *"
                      value={formData.doctor}
                      onChange={handleInputChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="department"
                      label="Department"
                      value={formData.department}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="details"
                      label="Details *"
                      value={formData.details}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Status and Results Section */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 500 }}>
                  Status and Results
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        label="Status"
                      >
                        {statusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="result"
                      label="Result"
                      value={formData.result}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Additional Information Section */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 500 }}>
                  Additional Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      name="instructions"
                      label="Instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="notes"
                      label="Notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 500 }}>
                  Documents
                </Typography>
                <Box sx={{ 
                  p: 3, 
                  border: '2px dashed rgba(25, 118, 210, 0.2)',
                  borderRadius: 2,
                  backgroundColor: 'rgba(25, 118, 210, 0.05)',
                  textAlign: 'center'
                }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFileIcon />}
                    sx={{ 
                      mb: 2,
                      bgcolor: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.1)'
                      }
                    }}
                  >
                    Upload Files
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt"
                    />
                  </Button>

                  {files.length > 0 && (
                    <List sx={{ 
                      bgcolor: 'white', 
                      borderRadius: 1,
                      mt: 2
                    }}>
                      {files.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                            sx={{ 
                              '& .MuiListItemText-primary': { 
                                color: '#1976d2',
                                fontWeight: 500
                              }
                            }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              onClick={() => handleRemoveFile(index)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2
            }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={submitting}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0'
                  }
                }}
              >
                {submitting ? 'Saving...' : 'Save Record'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddMedicalRecordForm; 