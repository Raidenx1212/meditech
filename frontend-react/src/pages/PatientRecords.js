import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { PatientService } from '../services/api.service';

const PatientRecords = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log('Fetching patients from API...');
      // Use the PatientService to fetch patient data
      const response = await PatientService.getAllPatients();
      console.log('API response:', response);
      console.log('Patient data:', response.data);
      setPatients(response.data.patients || []); // Make sure to handle different response formats
    } catch (err) {
      console.error('Error fetching patients:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      setError('Failed to load patient records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewPatient = async (patientId) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewError('');
    try {
      const response = await PatientService.getPatientById(patientId);
      setSelectedPatient(response.data.patient || response.data);
    } catch (err) {
      setViewError('Failed to fetch patient details.');
      setSelectedPatient(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedPatient(null);
    setViewError('');
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Paginate the filtered patients
  const paginatedPatients = filteredPatients.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate age from date of birth
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Records
        </Typography>
        <Button
          component={Link}
          to="/patients/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Patient
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box px={2} py={1}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 2, mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Added By</TableCell>
                <TableCell>Added On</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => (
                  <TableRow key={patient._id || patient.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        {`${patient.firstName} ${patient.lastName}`}
                      </Box>
                    </TableCell>
                    <TableCell>{calculateAge(patient.dateOfBirth)}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.contactNumber}</TableCell>
                    <TableCell>
                      {patient.createdBy ? 
                        `${patient.createdBy.firstName || ''} ${patient.createdBy.lastName || ''} (${patient.createdBy.role || 'unknown'})` : 
                        'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(patient.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton 
                          color="primary" 
                          component={Link}
                          to={`/patients/view/${patient._id || patient.id}`}
                          sx={{ borderRadius: 2, bgcolor: 'grey.100', '&:hover': { bgcolor: 'primary.light' } }}
                          title="View Patient Details"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No patients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Patient View Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, textAlign: 'center', pb: 0 }}>Patient Details</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {viewLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
              <CircularProgress />
            </Box>
          ) : viewError ? (
            <Alert severity="error">{viewError}</Alert>
          ) : selectedPatient ? (
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 72, height: 72, mx: 'auto', mb: 2 }}>
                <PersonIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {selectedPatient.firstName} {selectedPatient.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {selectedPatient._id || selectedPatient.id}
              </Typography>
              <Box mb={1}><b>Age:</b> {calculateAge(selectedPatient.dateOfBirth)}</Box>
              <Box mb={1}><b>Gender:</b> {selectedPatient.gender}</Box>
              <Box mb={1}><b>Email:</b> {selectedPatient.email}</Box>
              <Box mb={1}><b>Contact:</b> {selectedPatient.contactNumber}</Box>
              <Box mb={1}><b>Address:</b> {selectedPatient.address}</Box>
              <Box mb={1}><b>Status:</b> <Chip label={selectedPatient.status ? (selectedPatient.status === 'active' ? 'Active' : 'Inactive') : 'Active'} color={selectedPatient.status ? (selectedPatient.status === 'active' ? 'success' : 'default') : 'success'} size="small" /></Box>
              <Box mb={1}><b>Created At:</b> {formatDate(selectedPatient.createdAt || selectedPatient.dateOfBirth)}</Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={handleCloseViewDialog} color="primary" variant="contained" sx={{ borderRadius: 2, px: 4 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientRecords; 