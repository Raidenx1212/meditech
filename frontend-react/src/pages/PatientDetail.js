import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Event as EventIcon,
  MedicalServices as MedicalIcon,
  Schedule as ScheduleIcon,
  Biotech as BiotechIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { PatientService, MedicalRecordService } from '../services/api.service';
import BlockchainService from '../services/blockchain.service';
import IPFSService from '../services/ipfs.service';
import Web3Service from '../services/web3.service';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: '',
    diagnosis: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPatientData();
    checkWalletConnection();
  }, [id]);

  const checkWalletConnection = async () => {
    try {
      await Web3Service.initialize();
      const isConnected = Web3Service.isConnected();
      const isContractConnected = await BlockchainService.ensureWalletConnected();
      setIsWalletConnected(isConnected && isContractConnected);
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setIsWalletConnected(false);
    }
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch patient details first
      const patientResponse = await PatientService.getPatientById(id);
      
      if (!patientResponse.data?.success || !patientResponse.data?.patient) {
        throw new Error(patientResponse.data?.message || 'Failed to fetch patient data');
      }
      
      setPatient(patientResponse.data.patient);
      
      // Then fetch medical records
      try {
        const recordsResponse = await MedicalRecordService.getPatientRecords(id);
        
        if (recordsResponse.data?.records) {
          // Ensure each record has a patientId set if missing
          const recordsWithPatientId = recordsResponse.data.records.map(record => ({
            ...record,
            patientId: record.patientId || id
          }));
          
          // Sort records by date (newest first)
          const sortedRecords = [...recordsWithPatientId].sort((a, b) => 
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          );
          
          setRecords(sortedRecords);
        } else {
          setRecords([]);
        }
      } catch (recordError) {
        console.error('Error fetching patient records:', recordError);
        setError('Could not retrieve patient records. ' + (recordError.message || ''));
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load patient information. Please try again.');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddRecord = async () => {
    if (!isWalletConnected) {
      setSnackbar({
        open: true,
        message: 'Please connect your wallet first to add a medical record',
        severity: 'error'
      });
      return;
    }

    if (!patient) {
      setSnackbar({
        open: true,
        message: 'Patient information not available. Please reload the page.',
        severity: 'error'
      });
      return;
    }

    setShowAddRecordDialog(true);
  };

  const handleSaveRecord = async () => {
    // Validate record data
    if (!newRecord.type || !newRecord.diagnosis) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // First, ensure wallet is connected
      try {
        const connected = await BlockchainService.ensureWalletConnected();
        if (!connected) {
          throw new Error('Failed to connect wallet. Please check MetaMask and try again.');
        }
      } catch (walletError) {
        console.error('Wallet connection error:', walletError);
        setSnackbar({
          open: true,
          message: 'Wallet connection error: ' + walletError.message,
          severity: 'error'
        });
        setLoading(false);
        return;
      }

      // Prepare record data
      const recordData = {
        ...newRecord,
        patientId: id,
        date: newRecord.date || new Date().toISOString().split('T')[0]
      };
      
      // Upload record to IPFS
      let recordHash;
      try {
        recordHash = await IPFSService.uploadJSON(recordData);
        console.log('Record uploaded to IPFS:', recordHash);
      } catch (ipfsError) {
        console.error('IPFS upload error:', ipfsError);
        throw new Error('Failed to upload record to IPFS: ' + (ipfsError.message || 'Unknown error'));
      }
      
      // Add record to blockchain
      let txHash;
      try {
        // Create record object in the format expected by BlockchainService
        const blockchainRecordData = {
          ipfsHash: recordHash,
          type: recordData.type,
          diagnosis: recordData.diagnosis,
          notes: recordData.notes || ''
        };
        
        console.log('Adding record to blockchain:', blockchainRecordData);
        txHash = await BlockchainService.addPatientRecord(id, blockchainRecordData);
        console.log('Transaction hash:', txHash);
      } catch (blockchainError) {
        console.error('Blockchain error:', blockchainError);
        throw new Error('Failed to add record to blockchain: ' + (blockchainError.message || 'Transaction failed'));
      }
      
      // Add record to database with blockchain reference
      try {
        const dbRecordData = {
          ...recordData,
          patientId: id,
          ipfsHash: recordHash,
          blockchainTxHash: txHash
        };
        
        const response = await MedicalRecordService.createRecord(dbRecordData);
        
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Database save failed');
        }
        
        // Add the new record to the beginning of the records array (newest first)
        if (response.data.record) {
          setRecords([response.data.record, ...records]);
        }
        
        setShowAddRecordDialog(false);
        
        // Reset form
        setNewRecord({
          type: '',
          diagnosis: '',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        });
        
        setSnackbar({
          open: true,
          message: 'Record added successfully!',
          severity: 'success'
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Record was added to blockchain but failed to save in database: ' + (dbError.message || 'Database error'));
      }
    } catch (error) {
      console.error('Error adding record:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to add medical record',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecord = async (record) => {
    try {
      const isVerified = await BlockchainService.verifyRecord(id, record._id);
      setSnackbar({
        open: true,
        message: isVerified ? 'Record verified on blockchain!' : 'Record verification failed',
        severity: isVerified ? 'success' : 'error'
      });
    } catch (error) {
      console.error('Error verifying record:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to verify record',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEditPatient = () => {
    navigate(`/patients/${id}/edit`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!patient) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Patient not found.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton 
            component={Link} 
            to="/patients" 
            color="primary" 
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Patient Profile
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEditPatient}
        >
          Edit Profile
        </Button>
      </Box>

      {/* Patient Summary Card */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={2} display="flex" justifyContent="center">
            <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main' }}>
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="h5" gutterBottom>
              {`${patient.firstName} ${patient.lastName}`}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>ID:</Box> {patient._id}
            </Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <PersonIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                {patient.gender}, {calculateAge(patient.dateOfBirth)} years
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <CalendarIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                DOB: {formatDate(patient.dateOfBirth)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <PhoneIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                {patient.contactNumber}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box display="flex" alignItems="center" mb={1}>
              <EmailIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                {patient.email}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <HomeIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                {patient.address}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <BiotechIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Blood Group: {patient.bloodGroup}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Additional Information */}
        <Box mt={3}>
          <Divider sx={{ my: 2 }} />
          
          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Allergies
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {patient.allergies.map((allergy, index) => (
                  <Chip key={index} label={allergy} color="error" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {/* Current Medications */}
          {patient.medication && patient.medication.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Current Medications
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {patient.medication.map((med, index) => (
                  <Chip key={index} label={med} color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {/* Created By */}
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Created by: {patient?.createdBy?.firstName} {patient?.createdBy?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registration Date: {formatDate(patient?.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs for different sections */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Medical Records" />
          <Tab label="Personal Information" />
          <Tab label="Insurance Details" />
        </Tabs>
      </Box>

      {/* Tab panels */}
      <Box sx={{ mt: 2 }}>
        {/* Medical Records Tab */}
        {tabValue === 0 && (
          <Paper sx={{ mt: 3 }}>
            <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Medical Records</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddRecord}
              >
                Add Record
              </Button>
            </Box>
            
            <Divider />
            
            {records.length === 0 ? (
              <Box p={4} textAlign="center">
                <Typography color="text.secondary">
                  No medical records found for this patient.
                </Typography>
              </Box>
            ) : (
              <List>
                {records.map((record) => (
                  <React.Fragment key={record._id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <IconButton edge="end" component={Link} to={`/records/${record._id}`}>
                          <DescriptionIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <EventIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {record?.type || 'Medical Record'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              Date: {formatDate(record?.date)}
                            </Typography>
                            {record?.diagnosis && (
                              <Typography component="div" variant="body2">
                                Diagnosis: {record.diagnosis}
                              </Typography>
                            )}
                            {record?.notes && (
                              <Typography component="div" variant="body2" color="text.secondary">
                                {record.notes}
                              </Typography>
                            )}
                            <Typography component="div" variant="body2" color="text.secondary">
                              Created by: {record?.createdBy?.firstName} {record?.createdBy?.lastName}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        )}

        {/* Personal Information Tab */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Personal Details</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Allergies</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, index) => (
                      <Chip key={index} label={allergy} color="error" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2">No known allergies</Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Emergency Contact</Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>Name:</Box> {patient.emergencyContact.name}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>Relationship:</Box> {patient.emergencyContact.relationship}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>Phone:</Box> {patient.emergencyContact.phone}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Insurance Details Tab */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Insurance Information</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>Provider:</Box> {patient.insurance.provider}
                </Typography>
                <Typography variant="body1">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>Policy Number:</Box> {patient.insurance.policyNumber}
                </Typography>
                <Typography variant="body1">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>Expiry Date:</Box> {formatDate(patient.insurance.expiryDate)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Add Record Dialog */}
      <Dialog open={showAddRecordDialog} onClose={() => setShowAddRecordDialog(false)}>
        <DialogTitle>Add New Medical Record</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Type"
            fullWidth
            value={newRecord.type}
            onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Diagnosis"
            fullWidth
            value={newRecord.diagnosis}
            onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={newRecord.notes}
            onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={newRecord.date}
            onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddRecordDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRecord} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientDetail; 