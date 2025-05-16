import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalHospital as LocalHospitalIcon
} from '@mui/icons-material';
import { AuthService } from '../services/api.service';
import Web3Service from '../services/web3.service';
import { clearAllAuthData } from '../services/auth-cleanup';
import { shortenAddress } from '../utils/formatUtils';
import { lazy, Suspense } from 'react';

// Lazy load MetaMaskAuth component
const MetaMaskAuth = lazy(() => import('../components/common/MetaMaskAuth'));

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: ''
  });

  // Optimize transitions for better performance
  const transitionStyles = {
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
    willChange: 'opacity, transform'
  };

  // Memoize the wallet status check function
  const checkInitialWalletStatus = React.useCallback(async () => {
    try {
      setWalletLoading(true);
      await Web3Service.initialize();
      const address = Web3Service.getCurrentAddress();
      if (address) {
        setWalletAddress(address);
      }
    } catch (error) {
      console.warn('Initial wallet check failed', error);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  // Combine useEffects and optimize initialization
  useEffect(() => {
    let mounted = true;

    // Clear all stored sessions when Login page loads
    // This ensures no automatic login happens
    clearAllAuthData();

    const init = async () => {
      try {
        if (!mounted) return;
        await checkInitialWalletStatus();
        
        if (!mounted) return;
        
        // Handle success message from registration
        if (location.state?.successMessage || location.state?.message) {
          setSuccessMessage(location.state.successMessage || location.state.message);
          window.history.replaceState({}, document.title);
        }
        
        // Handle URL parameters
        const queryParams = new URLSearchParams(window.location.search);
        const emailParam = queryParams.get('email');
        const sessionExpired = queryParams.get('session_expired');
        
        if (emailParam || location.state?.email) {
          setFormData(prev => ({
            ...prev,
            email: emailParam || location.state?.email || ''
          }));
        }
        
        if (sessionExpired === 'true') {
          setError('Your session has expired. Please login again.');
        }
        
        // Clean up URL
        if (emailParam || sessionExpired) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } finally {
        if (mounted) {
          setPageLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [location.state, checkInitialWalletStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear messages when user starts typing
    setError('');
    setSuccessMessage('');
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleUseRegisteredEmail = (email) => {
    setFormData(prev => ({ ...prev, email }));
    setError('');
  };

  const handleMetaMaskConnect = React.useCallback(async (address) => {
    if (address === walletAddress) return;

    setWalletLoading(true);
    try {
      const registeredEmail = await AuthService.getRegisteredEmail(address);

      setWalletAddress(address);
      if (registeredEmail) {
        setFormData(prev => ({
          ...prev,
          email: registeredEmail
        }));
        setError(null);
      } else {
        setError(`The wallet address ${address} is not registered. Please register an account with this wallet before logging in.`);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setWalletLoading(false);
    }
  }, [walletAddress]);

  const handleMetaMaskDisconnect = React.useCallback(async () => {
    try {
      await Web3Service.disconnectWallet();
      setWalletAddress('');
      setFormData(prev => ({ ...prev, email: '' }));
      setError('');
      // Force a page reload to ensure state is reset
      window.location.reload();
    } catch (error) {
      setError('Failed to disconnect wallet.');
    }
  }, []);

  const handleSubmit = async (e) => {
    // Always prevent default form submission
    if (e) {
      e.preventDefault();
    } else {
      // If no event was passed, this might be an automatic submission
      // We'll block this to prevent auto-login
      console.warn('Attempted auto-login blocked. Manual form submission required.');
      return;
    }

    // Strict form validation
    if (!formData.email || !formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!formData.password || formData.password.length < 1) {
      setError('Please enter your password');
      return;
    }

    if (!walletAddress) {
      setError('Please connect your MetaMask wallet before signing in');
      return;
    }

    // Prevent login if wallet error is present
    if (
      error &&
      (error.includes('not registered') || error.includes('already registered with email'))
    ) {
      return;
    }

    // Continue with login process
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // First check if the email has an associated wallet address
      try {
        const checkResponse = await AuthService.checkEmailWallet(formData.email.trim());
        if (checkResponse.data?.walletAddress && 
            checkResponse.data.walletAddress.trim().toLowerCase() !== walletAddress.trim().toLowerCase()) {
          const shortWallet = shortenAddress(checkResponse.data.walletAddress);
          throw new Error(`This account is linked to a different wallet address (${shortWallet}). Please connect the correct wallet to continue.`);
        }
      } catch (walletCheckError) {
        // Only throw if this is a wallet mismatch error, not if the endpoint doesn't exist
        if (walletCheckError.message && walletCheckError.message.includes('linked to a different wallet')) {
          throw walletCheckError;
        }
        // Otherwise continue with login - the API might not support this check yet
      }
      
      // Check if wallet is registered with a different email
      try {
        const walletResponse = await AuthService.checkWalletAddress(walletAddress);
        if (walletResponse.data?.success && 
            walletResponse.data.fullEmail && 
            walletResponse.data.fullEmail.toLowerCase() !== formData.email.trim().toLowerCase()) {
          const maskedEmail = shortenAddress(walletResponse.data.fullEmail);
          throw new Error(`This wallet is already registered with email ${maskedEmail}. Please use that email instead.`);
        }
      } catch (walletEmailError) {
        // Only throw if this is a wallet mismatch error, not if the endpoint doesn't exist
        if (walletEmailError.message && walletEmailError.message.includes('already registered with email')) {
          throw walletEmailError;
        }
        // Continue with login for 404 errors (wallet not found) or API not available
      }
      
      const response = await AuthService.login(
        formData.email.trim(),
        formData.password,
        walletAddress
      );
      
      // Sometimes the response structure is different based on API implementation
      // Handle various response formats
      const responseData = response.data;
      const success = responseData.success === true;
      const token = responseData.token || responseData.accessToken || '';
      const userData = responseData.user || {};
      
      if (!success || !token) {
        throw new Error(responseData.message || 'Login failed. Please check your credentials.');
      }
      
      // Successfully logged in
      setSuccessMessage('Login successful! Redirecting...');
      
      // Check if we need to redirect to a specific page after login
      const redirectPath = sessionStorage.getItem('redirect_after_login');
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login'); // Clear it after use
        setTimeout(() => {
          navigate(redirectPath);
        }, 1500);
      } else {
        // Default redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;
        
        if (error.response.status === 401) {
          // Authentication error
          setError(errorData?.message || 'Incorrect email or password. Please try again.');
        } else if (error.response.status === 403) {
          // Access forbidden
          setError(errorData?.message || 'Your account has been locked. Please contact support.');
        } else if (errorData?.message && errorData.message.includes('wallet')) {
          // Wallet-related error
          setError(errorData.message);
        } else {
          // Other server errors
          setError(errorData?.message || 'An error occurred during login. Please try again.');
        }
      } else if (error.request) {
        // No response received
        setError('Unable to connect to the server. Please try again later.');
      } else {
        // Other errors (including custom error messages we threw earlier)
        setError(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container component="main" maxWidth="xs">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 8,
          p: 3,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          ...transitionStyles
        }}
      >
        {walletAddress && (
          <Box sx={{ width: '100%', textAlign: 'right', mb: 1 }}>
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              onClick={handleMetaMaskDisconnect}
            >
              Disconnect Wallet
            </Button>
          </Box>
        )}

        {pageLoading ? (
          <CircularProgress />
        ) : (
          <>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <LocalHospitalIcon />
            </Avatar>
            
            <Typography component="h1" variant="h5" gutterBottom>
              Sign In
            </Typography>

            {/* MetaMask Section */}
            <Box sx={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography variant="subtitle1">
                Connect Your Wallet
              </Typography>
              
              <Box sx={{ 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderRadius: 1,
                p: 1
              }}>
                {walletLoading ? (
                  <CircularProgress size={24} />
                ) : walletAddress ? (
                  <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <Alert severity="success">
                      Wallet Connected and Verified
                    </Alert>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {shortenAddress(walletAddress)}
                    </Typography>
                  </Box>
                ) : (
                  <Suspense fallback={<CircularProgress size={24} />}>
                    <MetaMaskAuth 
                      onConnect={handleMetaMaskConnect}
                      onDisconnect={handleMetaMaskDisconnect}
                    />
                  </Suspense>
                )}
              </Box>
            </Box>

            {/* Divider for credentials */}
            <Box sx={{ width: '100%', py: 0.5 }}>
              <Divider textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Enter Your Credentials
                </Typography>
              </Divider>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              {/* Fixed height container for alerts */}
              <Box sx={{ 
                mb: 2,
                ...transitionStyles
              }}>
                {error && (
                  <Alert 
                    severity="error" 
                    sx={{
                      opacity: error ? 1 : 0,
                      transform: error ? 'translateY(0)' : 'translateY(-10px)',
                      ...transitionStyles
                    }}
                  >
                    {error}
                  </Alert>
                )}
                {successMessage && (
                  <Alert 
                    severity="success"
                    sx={{
                      opacity: successMessage ? 1 : 0,
                      transform: successMessage ? 'translateY(0)' : 'translateY(-10px)',
                      ...transitionStyles
                    }}
                  >
                    {successMessage}
                  </Alert>
                )}
              </Box>

              {error && error.toLowerCase().includes('not registered') && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button variant="outlined" color="primary" onClick={() => navigate('/register', { state: { email: formData.email } })}>
                    Register Here
                  </Button>
                </Box>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus={!location.state?.email}
                value={formData.email}
                onChange={handleChange}
                disabled={walletLoading}
                error={!!error && !formData.email}
                sx={{ ...transitionStyles, mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={walletLoading}
                error={!!error && !formData.password}
                sx={{ ...transitionStyles, mt: 0 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        disabled={walletLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Forgot password?
                  </Typography>
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || walletLoading || (!walletAddress && !walletLoading)}
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5,
                  minHeight: '48px',
                  ...transitionStyles
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              {!walletLoading && !walletAddress && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please connect your MetaMask wallet to sign in
                </Alert>
              )}

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main' }}>
                    Sign up here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Paper>
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          By signing in, you agree to our{' '}
          <Link to="/terms" style={{ textDecoration: 'none', color: 'primary.main' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" style={{ textDecoration: 'none', color: 'primary.main' }}>
            Privacy Policy
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default Login; 