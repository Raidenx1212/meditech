import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Dns as DnsIcon,
  Storage as StorageIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { runAllTests, testBackendConnection, testMongoDBConnection, testPatientCreation } from '../utils/connection-test';

const ConnectionTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState({
    backend: false,
    mongodb: false,
    patient: false
  });

  const handleRunTests = async () => {
    setLoading(true);
    try {
      const testResults = await runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandToggle = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderStatus = (success) => {
    return success ? (
      <CheckCircleIcon color="success" />
    ) : (
      <ErrorIcon color="error" />
    );
  };

  const renderTestResult = (title, icon, result, sectionKey) => {
    if (!result) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <ListItem
          button
          onClick={() => handleExpandToggle(sectionKey)}
          sx={{ 
            bgcolor: result.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(239, 83, 80, 0.1)',
            borderRadius: 1
          }}
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText 
            primary={title} 
            secondary={result.message}
          />
          {renderStatus(result.success)}
          {expanded[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>
        
        <Collapse in={expanded[sectionKey]} timeout="auto">
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Response Details:
            </Typography>
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.900', 
                color: 'common.white', 
                borderRadius: 1,
                overflowX: 'auto',
                fontSize: '0.8rem'
              }}
            >
              {JSON.stringify(result.data || result.error || {}, null, 2)}
            </Box>

            {result.response && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Error Response:
                </Typography>
                <Box 
                  component="pre" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.900', 
                    color: 'common.white', 
                    borderRadius: 1,
                    overflowX: 'auto',
                    fontSize: '0.8rem'
                  }}
                >
                  {JSON.stringify(result.response?.data || {}, null, 2)}
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Connection Diagnostics
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This tool will test your connection to the backend server and database, and attempt to verify patient creation functionality.
        </Typography>
        
        <Button 
          variant="contained"
          color="primary"
          onClick={handleRunTests}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Running Tests...' : 'Run Diagnostic Tests'}
        </Button>
      </Paper>

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <List sx={{ width: '100%' }}>
            {renderTestResult('Backend Connection', <DnsIcon />, results.backend, 'backend')}
            {renderTestResult('MongoDB Connection', <StorageIcon />, results.mongodb, 'mongodb')}
            {renderTestResult('Patient Creation', <PersonIcon />, results.patient, 'patient')}
          </List>

          {results.backend.success === false && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Backend server is not responding. Please ensure the backend server is running at {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}.
            </Alert>
          )}

          {results.backend.success && results.mongodb?.success === false && (
            <Alert severity="error" sx={{ mt: 2 }}>
              MongoDB connection failed. Database might be down or misconfigured.
            </Alert>
          )}

          {results.mongodb?.success && results.patient?.success === false && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Patient creation failed. Check the authentication token and patient data format.
            </Alert>
          )}

          {results.patient?.success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              All tests passed successfully! The system is functioning properly.
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ConnectionTest; 