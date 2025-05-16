import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Toolbar,
  Grid,
  Paper,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  useMediaQuery,
  useTheme,
  InputAdornment,
  OutlinedInput,
  Card,
  CardContent,
  Avatar,
  Fade,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LocalHospital as HospitalIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { AuthService } from '../services/api.service';
import Web3Service from '../services/web3.service';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [legalMenuAnchor, setLegalMenuAnchor] = React.useState(null);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First validate form
      if (!formData.email || !formData.email.trim()) {
        throw new Error('Please enter your email address');
      }

      if (!formData.password) {
        throw new Error('Please enter your password');
      }

      // Ensure wallet is connected before attempting login
      let walletAddress = null;
      try {
        // Initialize Web3Service if needed
        await Web3Service.initialize();
        walletAddress = Web3Service.getCurrentAddress();
        
        if (!walletAddress) {
          walletAddress = await Web3Service.connectWallet();
          if (!walletAddress) {
            throw new Error('Failed to connect wallet');
          }
        }
      } catch (walletError) {
        throw new Error('Please connect your MetaMask wallet before signing in: ' + walletError.message);
      }

      // Proceed with login
      const response = await AuthService.login(
        formData.email.trim(),
        formData.password,
        formData.rememberMe
      );

      if (response.data?.token || response.data?.success) {
        // Login successful, redirect to dashboard
        navigate('/dashboard');
      } else {
        throw new Error(response.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        setError(error.response.data?.message || 'Invalid email or password');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLegalMenuOpen = (event) => {
    setLegalMenuAnchor(event.currentTarget);
  };

  const handleLegalMenuClose = () => {
    setLegalMenuAnchor(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8faff' }}>
      {/* Main Navigation */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        backgroundColor: 'white',
        position: 'fixed',
        width: '100%',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'  
      }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1 }}>
                <HospitalIcon />
              </Avatar>
              <Typography 
                variant="h5" 
                component={Link} 
                to="/" 
                sx={{ 
                  color: theme.palette.primary.main, 
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  letterSpacing: 0.5
                }}
              >
                MediTech
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/"
                sx={{ mx: 1 }}
              >
                Home
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/about"
                sx={{ mx: 1 }}
              >
                About Us
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/contact"
                sx={{ mx: 1 }}
              >
                Contact Us
              </Button>
              <Box>
                <Button 
                  color="inherit"
                  onClick={handleLegalMenuOpen}
                  endIcon={<ArrowDownIcon />}
                  sx={{ mx: 1 }}
                >
                  Legal
                </Button>
                <Menu
                  anchorEl={legalMenuAnchor}
                  open={Boolean(legalMenuAnchor)}
                  onClose={handleLegalMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem 
                    component={Link} 
                    to="/privacy" 
                    onClick={handleLegalMenuClose}
                  >
                    Privacy Policy
                  </MenuItem>
                  <MenuItem 
                    component={Link} 
                    to="/terms" 
                    onClick={handleLegalMenuClose}
                  >
                    Terms and Conditions
                  </MenuItem>
                </Menu>
              </Box>
              <Button 
                variant="outlined" 
                color="primary" 
                component={Link} 
                to="/login"
                sx={{ mx: 1 }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/register"
                sx={{ ml: 1 }}
              >
                Sign Up
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box 
        sx={{ 
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 8 },
          mt: 8,
          background: 'linear-gradient(45deg, #f8faff 30%, #e3f2fd 90%)',
          position: 'relative'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={10} textAlign="center">
              <Fade in={true} timeout={1000}>
                <Box>
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 800,
                      color: theme.palette.primary.dark,
                      mb: 3,
                      lineHeight: 1.2
                    }}
                  >
                    Secure Healthcare Records
                    <Box component="span" sx={{ color: theme.palette.primary.main }}>
                      {' '}on Blockchain
                    </Box>
                  </Typography>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.secondary',
                      mb: 4,
                      maxWidth: '800px',
                      mx: 'auto'
                    }}
                  >
                    Transform healthcare data management with our innovative blockchain solution. 
                    Secure, transparent, and efficient record-keeping for the modern healthcare industry.
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
                    <Grid item xs={12} sm={6} md={5}>
                      <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                              <SecurityIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold">
                              Enhanced Security
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Military-grade encryption and blockchain immutability for your medical data.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={5}>
                      <Card elevation={0} sx={{ bgcolor: 'transparent' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                              <SpeedIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold">
                              Instant Access
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Access your medical records anytime, anywhere securely.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large"
                      component={Link}
                      to="/register"
                      sx={{ 
                        px: 4, 
                        py: 1.5,
                        fontWeight: 'bold',
                        borderRadius: 2,
                        boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
                      }}
                    >
                      Get Started
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="large"
                      component={Link}
                      to="/about"
                      sx={{ 
                        px: 4, 
                        py: 1.5,
                        fontWeight: 'bold',
                        borderRadius: 2
                      }}
                    >
                      Learn More
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 