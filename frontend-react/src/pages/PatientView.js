import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Divider,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Wc as GenderIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  PersonAdd as PersonAddIcon,
  ListAlt as ListAltIcon,
  MedicalServices as MedicalIcon
} from '@mui/icons-material';
import { PatientService, MedicalRecordService } from '../services/api.service';

const PatientView = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await PatientService.getPatientById(id);
        setPatient(response.data.patient || response.data);
        
        // After getting patient data, fetch their medical records
        fetchMedicalRecords(id);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to fetch patient details.');
        setPatient(null);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchMedicalRecords = async (patientId) => {
      setRecordsLoading(true);
      try {
        const records = await MedicalRecordService.getPatientRecords(patientId);
        setMedicalRecords(records.data?.medicalRecords || records.data || []);
      } catch (err) {
        console.error('Error fetching medical records:', err);
      } finally {
        setRecordsLoading(false);
      }
    };
    
    fetchPatient();
  }, [id]);

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Button
          component={Link}
          to="/patients"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}
        >
          Back to Patient Records
        </Button>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : patient ? (
          <Grid container spacing={3}>
            {/* Patient Basic Info Card */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, boxShadow: 3, height: '100%' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 100, height: 100, mx: 'auto', mb: 2, fontSize: 48, boxShadow: 3 }}>
                    <PersonIcon fontSize="inherit" />
                  </Avatar>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                    <BadgeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    <span style={{ fontFamily: 'monospace' }}>{patient._id || patient.id}</span>
                  </Typography>
                  <Chip
                    label={patient.status ? (patient.status === 'active' ? 'Active' : 'Inactive') : 'Active'}
                    color={patient.status ? (patient.status === 'active' ? 'success' : 'default') : 'success'}
                    size="medium"
                    sx={{ fontWeight: 600, fontSize: 14, px: 1, mt: 1 }}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Stack spacing={2.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <CalendarIcon color="primary" />
                    <Typography variant="body1"><b>Age:</b> {calculateAge(patient.dateOfBirth)} years ({formatDate(patient.dateOfBirth)})</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <GenderIcon color="primary" />
                    <Typography variant="body1"><b>Gender:</b> {patient.gender}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <EmailIcon color="primary" />
                    <Typography variant="body1"><b>Email:</b> {patient.email}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <PhoneIcon color="primary" />
                    <Typography variant="body1"><b>Contact:</b> {patient.contactNumber}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <HomeIcon color="primary" />
                    <Typography variant="body1"><b>Address:</b> {patient.address}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            
            {/* Patient Registration Info Card */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, boxShadow: 3, height: '100%' }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Registration Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={2.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <TimeIcon color="primary" />
                    <Typography variant="body1">
                      <b>Created on:</b> {formatDate(patient.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <PersonAddIcon color="primary" />
                    <Typography variant="body1">
                      <b>Added by:</b> {patient.createdBy ? 
                        `${patient.createdBy.firstName || ''} ${patient.createdBy.lastName || ''} (${patient.createdBy.role || 'unknown'})` : 
                        'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <ListAltIcon color="primary" />
                    <Typography variant="body1">
                      <b>Medical Records:</b> {recordsLoading ? 
                        <CircularProgress size={16} sx={{ ml: 1 }} /> : 
                        medicalRecords.length}
                    </Typography>
                  </Box>
                  
                  {patient.pendingDocuments && patient.pendingDocuments.length > 0 && (
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <MedicalIcon color="warning" />
                      <Typography variant="body1">
                        <b>Pending Documents:</b> {patient.pendingDocuments.length}
                      </Typography>
                    </Box>
                  )}
                  
                  {patient.updatedAt && patient.updatedAt !== patient.createdAt && (
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <TimeIcon color="primary" />
                      <Typography variant="body1">
                        <b>Last Updated:</b> {formatDate(patient.updatedAt)}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        ) : null}
      </Box>
    </Box>
  );
};

export default PatientView; 