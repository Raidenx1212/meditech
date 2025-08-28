import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Paper,
  Container,
  Avatar,
  Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  PersonAddOutlined, 
  LocalHospital,
  AccountBalanceWallet
} from '@mui/icons-material';
import { AuthService, testMongoDBConnection } from '../services/api.service';
import MetaMaskAuth from '../components/common/MetaMaskAuth';
import Web3Service from '../services/web3.service';
import { maskEmail } from '../utils/formatUtils';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    walletAddress: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [dbStatus, setDbStatus] = useState({ checked: false, isConnected: false, message: '' });
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const emailCheckTimeoutRef = useRef(null);
  const [walletExistsInfo, setWalletExistsInfo] = useState(null);
  
  // Add MongoDB check on component mount
  useEffect(() => {
    const checkMongoDBConnection = async () => {
      try {
        console.log('Checking MongoDB connection from Register component...');
        
        // Set checking state
        setDbStatus({
          checked: false,
          isConnected: false, 
          message: 'Checking database connection...'
        });
        
        // Try to fetch with a timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection check timed out')), 8000)
        );
        
        const fetchPromise = testMongoDBConnection();
        
        // Race the fetch against the timeout
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        console.log('MongoDB connection test result:', result);
        
        setDbStatus({
          checked: true,
          isConnected: result.success === true,
          message: result.success 
            ? 'Connected to database' 
            : (result.error?.message || result.data?.message || 'Could not test MongoDB connection')
        });
      } catch (error) {
        console.error('Error checking MongoDB connection:', error);
        setDbStatus({
          checked: true,
          isConnected: false,
          message: 'Failed to check database connection: ' + (error.message || 'Unknown error')
        });
      }
    };

    checkMongoDBConnection();
    
    // Cleanup function to clear any pending timeouts when unmounting
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleMetaMaskConnect = async (address) => {
    try {
      // Clear walletExistsInfo when a new wallet is connected
      setWalletExistsInfo(null);
      if (!address) {
        console.error('Register: No wallet address received from MetaMask connection');
        setApiError('Failed to connect MetaMask wallet. Please try again.');
        return;
      }
      
      console.log('Register: MetaMask connected with address', address);
      
      // Set the wallet address immediately to show it's connected in the UI
      setFormData(prev => ({ ...prev, walletAddress: address }));
      setIsMetaMaskConnected(true);
      
      // Clear any previous errors
      if (errors.walletAddress) {
        setErrors(prev => ({ ...prev, walletAddress: '' }));
      }
      if (apiError) {
        setApiError('');
      }
      
      // Validate the wallet address format
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethAddressRegex.test(address)) {
        setApiError('Invalid wallet address format. Please reconnect your wallet.');
        setFormData(prev => ({ ...prev, walletAddress: '' }));
        setIsMetaMaskConnected(false);
        return;
      }
      
      // Check if wallet is already registered - do this after setting UI state
      setLoading(true);
      try {
        // First check by wallet address
        const walletResponse = await AuthService.checkWalletAddress(address);
        if (walletResponse.data?.success) {
          // Wallet already exists - prepare to redirect to login
          const email = walletResponse.data.email;
          setWalletExistsInfo({
            message: `This wallet is already linked to an existing account (${maskEmail(email)}). Please log in to continue.`,
            email
          });
          // Don't do any more wallet checks
          setLoading(false);
          return;
        }
      } catch (walletError) {
        // 404 means wallet doesn't exist yet, which is good
        if (walletError.response?.status !== 404) {
          console.error('Register: Error checking wallet:', walletError);
        }
      } finally {
        setLoading(false);
      }
      
      // Only check email if it's already been entered
      if (formData.email && formData.email.trim()) {
        checkEmailWallet(formData.email.trim());
      }
    } catch (error) {
      console.error('Register: MetaMask connect error:', error);
      setApiError('Error connecting to MetaMask: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };
  
  // Separate function to check email-wallet for better control
  const checkEmailWallet = async (email) => {
    if (!email) return;
    
    setLoading(true);
    try {
      const emailCheckResponse = await AuthService.checkEmailWallet(email);
      if (emailCheckResponse.data?.success && emailCheckResponse.data?.walletAddress) {
        setApiError('This email already has a registered wallet. Please log in instead of registering.');
        setTimeout(() => {
          navigate('/login', { state: { email } });
        }, 3000);
      }
    } catch (emailCheckError) {
      // 404 means user doesn't exist yet, which is good
      if (emailCheckError.response?.status !== 404) {
        console.error('Register: Error checking email wallet:', emailCheckError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear field error when user starts typing again
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // Clear API error when form changes
    if (apiError) {
      setApiError('');
    }
    
    // Check email-wallet connection if the email field is changed and MetaMask is connected
    if (name === 'email' && isMetaMaskConnected) {
      // Clear any existing timeout first
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      
      // Only set timeout if there's a value to check
      if (value.trim()) {
        emailCheckTimeoutRef.current = setTimeout(() => {
          checkEmailWallet(value.trim());
          emailCheckTimeoutRef.current = null;
        }, 1000); // Debounce for 1 second
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Wallet validation
    if (!formData.walletAddress) {
      newErrors.walletAddress = 'Please connect your MetaMask wallet';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check MongoDB connection before proceeding
    if (!dbStatus.isConnected) {
      setApiError('Database is not accessible. Please try again later or contact support.');
      return;
    }

    if (validateForm()) {
      setLoading(true);
      setApiError('');
      
      try {
        // Verify MetaMask connection
        if (!isMetaMaskConnected) {
          throw new Error('Please connect your MetaMask wallet first');
        }

        // Check if email or wallet is already registered before submission
        try {
          // First check by email
          if (formData.email.trim()) {
            const emailCheck = await AuthService.checkEmailWallet(formData.email.trim());
            if (emailCheck.data?.success && emailCheck.data?.walletAddress) {
              setApiError('This email is already registered. Please log in instead.');
              navigate('/login', { state: { email: formData.email.trim() } });
              return;
            }
          }
          
          // Second, check wallet address separately via backend registration validation
          // This will be caught in the catch block below
        } catch (checkError) {
          // 404 means user doesn't exist yet, which is good
          if (checkError.response?.status !== 404) {
            console.error('Registration pre-check error:', checkError);
          }
        }

        // Transform formData to API format
        const apiData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          walletAddress: formData.walletAddress
        };
        
        // Use the AuthService to register
        const response = await AuthService.register(apiData);
        
        if (response && response.data) {
          // Clear any stored auth data to prevent auto-login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Show success message and redirect to login page
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please log in with your credentials.',
              email: formData.email
            } 
          });
        }
      } catch (error) {
        console.error('Registration error:', error);
        
        // Check for duplicate wallet address error
        if (error.response?.data?.message && 
            (error.response.data.message.includes('Wallet address already registered') ||
             error.response.data.code === 'WALLET_ALREADY_EXISTS')) {
          
          const message = error.response.data.message || 'This wallet address is already registered. Please log in instead.';
          
          // Extract email from error message if available
          let email = '';
          const match = message.match(/registered with email ([^\s.]+)/);
          if (match && match[1]) {
            email = match[1];
          }
          
          // Create enhanced message with masked email
          const enhancedMessage = email 
            ? `This wallet is already linked to an existing account (${maskEmail(email)}). Please log in to continue.`
            : 'This wallet is already linked to an existing account. Please log in to continue.';
          
          // Set wallet exists info to display the login link
          setWalletExistsInfo({ message: enhancedMessage, email });
          return;
        }
        
        // Handle validation errors from the backend
        if (error.response?.data?.errors) {
          const backendErrors = error.response.data.errors;
          const newErrors = {};
          
          // Map backend errors to form fields
          Object.keys(backendErrors).forEach(key => {
            if (backendErrors[key]) {
              newErrors[key] = backendErrors[key];
            }
          });
          
          setErrors(prevErrors => ({
            ...prevErrors,
            ...newErrors
          }));
        } else {
          // Set general API error
          setApiError(error.response?.data?.message || error.message || 'Registration failed');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <PersonAddOutlined />
        </Avatar>
        <Typography component="h1" variant="h5" gutterBottom>
          Create Account
        </Typography>

        {/* Database Status Alert */}
        {dbStatus.checked && !dbStatus.isConnected && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {dbStatus.message}
          </Alert>
        )}

        {/* MetaMask Connection Section */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <MetaMaskAuth onConnect={handleMetaMaskConnect} />
          {errors.walletAddress && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {errors.walletAddress}
            </Typography>
          )}
        </Box>

        <Divider sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Account Information
          </Typography>
        </Divider>

        {/* Registration Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          {/* Show wallet exists info with login link */}
          {walletExistsInfo && (
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              icon={<AccountBalanceWallet />}
            >
              {walletExistsInfo.message}
              <Box sx={{ mt: 1 }}>
                <Button 
                  variant="text" 
                  size="small"
                  color="primary"
                  onClick={() => navigate('/login', { 
                    state: { email: walletExistsInfo.email } 
                  })}
                >
                  Go to Login
                </Button>
              </Box>
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
          />

          <FormControl fullWidth margin="normal" error={!!errors.role}>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              label="Role"
            >
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
          </FormControl>

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading || !isMetaMaskConnected}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ textDecoration: 'none', color: 'primary.main' }}>
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 