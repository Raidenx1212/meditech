import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { AuthService } from '../services/api.service';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    specialization: '',
    licenseNumber: ''
  });
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form validation errors
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getCurrentUser();
      const userData = response?.user || response?.data?.user || response?.data || null;
      if (!userData) throw new Error('No user data received');
      setUser(userData);
      setProfileForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        specialization: userData.specialization || '',
        licenseNumber: userData.licenseNumber || ''
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
    
    // Clear field error when user starts typing again
    if (profileErrors[name]) {
      setProfileErrors({ ...profileErrors, [name]: '' });
    }
    
    // Clear success message
    if (success) {
      setSuccess('');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    
    // Clear field error when user starts typing again
    if (passwordErrors[name]) {
      setPasswordErrors({ ...passwordErrors, [name]: '' });
    }
    
    // Clear success message
    if (success) {
      setSuccess('');
    }
  };

  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!profileForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!profileForm.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    // If role is doctor, specialization is required
    if (profileForm.role === 'doctor' && !profileForm.specialization) {
      errors.specialization = 'Specialization is required for doctors';
    }
    
    // If role is doctor or nurse, license number is required
    if (['doctor', 'nurse'].includes(profileForm.role) && !profileForm.licenseNumber) {
      errors.licenseNumber = 'License number is required';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Reset form to current user data
    setProfileForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      specialization: user.specialization || '',
      licenseNumber: user.licenseNumber || ''
    });
    
    // Clear any errors
    setProfileErrors({});
    
    // Exit edit mode
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    if (validateProfileForm()) {
      setLoading(true);
      try {
        await AuthService.updateProfile(profileForm);
        setUser({ ...user, ...profileForm });
        setSuccess('Profile updated successfully');
        setIsEditMode(false);
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to update profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      setLoading(true);
      try {
        await AuthService.changePassword(passwordForm);
        setSuccess('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (err) {
        console.error('Error changing password:', err);
        setError('Failed to change password. Please check your current password and try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  if (loading && !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="Profile Information" />
          <Tab label="Change Password" />
        </Tabs>
      </Box>
      
      {/* Profile Information Tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center">
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main', 
                  fontSize: 36,
                  mr: 2
                }}
              >
                {(user?.firstName || '').charAt(0)}{(user?.lastName || '').charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {(user?.firstName || '') + ' ' + (user?.lastName || '')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '')}
                  {user?.specialization && ` - ${user.specialization}`}
                </Typography>
              </Box>
            </Box>
            
            {!isEditMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditProfile}
              >
                Edit Profile
              </Button>
            ) : (
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  sx={{ mr: 1 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                disabled={!isEditMode || loading}
                error={!!profileErrors.firstName}
                helperText={profileErrors.firstName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                disabled={!isEditMode || loading}
                error={!!profileErrors.lastName}
                helperText={profileErrors.lastName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                disabled={!isEditMode || loading}
                error={!!profileErrors.email}
                helperText={profileErrors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Role"
                value={profileForm.role ? profileForm.role.charAt(0).toUpperCase() + profileForm.role.slice(1) : ''}
                disabled
              />
            </Grid>
            
            {['doctor'].includes(profileForm.role) && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Specialization"
                  name="specialization"
                  value={profileForm.specialization}
                  onChange={handleProfileChange}
                  disabled={!isEditMode || loading}
                  error={!!profileErrors.specialization}
                  helperText={profileErrors.specialization}
                  required={profileForm.role === 'doctor'}
                />
              </Grid>
            )}
            
            {['doctor', 'nurse'].includes(profileForm.role) && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  name="licenseNumber"
                  value={profileForm.licenseNumber}
                  onChange={handleProfileChange}
                  disabled={!isEditMode || loading}
                  error={!!profileErrors.licenseNumber}
                  helperText={profileErrors.licenseNumber}
                  required
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Member since: {new Date(user?.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Change Password Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <LockIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h5">
              Change Password
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" onSubmit={handleChangePassword}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword}
                  disabled={loading}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('current')}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword}
                  disabled={loading}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                  disabled={loading}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ProfilePage; 