import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { Error as ErrorIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
        }}
      >
        <ErrorIcon color="error" sx={{ fontSize: 100, mb: 4 }} />
        
        <Typography variant="h1" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h4" color="text.secondary" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for does not exist or has been moved.
        </Typography>
        
        <Button 
          component={Link} 
          to="/dashboard" 
          variant="contained" 
          color="primary" 
          size="large"
          sx={{ mt: 2 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 