import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  LockOutlined as LockIcon,
  VisibilityOff as VisibilityIcon,
  Save as SaveIcon,
  Storage as StorageIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    
    // Privacy settings
    showProfileToOthers: true,
    shareActivityData: false,
    
    // Security settings
    twoFactorAuth: false,
    sessionTimeout: 30, // minutes
    
    // Display settings
    language: 'en',
    theme: 'light',
    fontSize: 14,
    
    // Data settings
    autoBackup: true,
    dataRetention: 90 // days
  });

  const handleToggleChange = (event) => {
    const { name, checked } = event.target;
    setSettings({
      ...settings,
      [name]: checked
    });
    
    // Clear success message when settings change
    if (success) {
      setSuccess(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSettings({
      ...settings,
      [name]: value
    });
    
    // Clear success message when settings change
    if (success) {
      setSuccess(false);
    }
  };

  const handleSliderChange = (name) => (event, newValue) => {
    setSettings({
      ...settings,
      [name]: newValue
    });
    
    // Clear success message when settings change
    if (success) {
      setSuccess(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    
    try {
      // In a real application, this would be an API call to save settings
      // await saveUserSettings(settings);
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Notifications
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <FormGroup>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.emailNotifications} 
                    onChange={handleToggleChange} 
                    name="emailNotifications" 
                  />
                } 
                label="Email Notifications" 
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
                Receive notifications about your account and patient activities via email.
              </Typography>
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.smsNotifications} 
                    onChange={handleToggleChange} 
                    name="smsNotifications" 
                  />
                } 
                label="SMS Notifications" 
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
                Receive important notifications via SMS.
              </Typography>
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.pushNotifications} 
                    onChange={handleToggleChange} 
                    name="pushNotifications" 
                  />
                } 
                label="Browser Push Notifications" 
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Receive notifications on your device when the app is not open.
              </Typography>
            </FormGroup>
          </Paper>
        </Grid>
        
        {/* Privacy Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <VisibilityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Privacy
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <FormGroup>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.showProfileToOthers} 
                    onChange={handleToggleChange} 
                    name="showProfileToOthers" 
                  />
                } 
                label="Show my profile to other healthcare providers" 
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
                Allow other authorized healthcare providers to view your profile information.
              </Typography>
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.shareActivityData} 
                    onChange={handleToggleChange} 
                    name="shareActivityData" 
                  />
                } 
                label="Share activity data for analytics" 
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Share anonymized usage data to help improve the platform.
              </Typography>
            </FormGroup>
          </Paper>
        </Grid>
        
        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Security
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <FormGroup>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.twoFactorAuth} 
                    onChange={handleToggleChange} 
                    name="twoFactorAuth" 
                  />
                } 
                label="Two-factor authentication" 
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2 }}>
                Add an extra layer of security to your account by requiring a second verification step.
              </Typography>
              
              <Box sx={{ ml: 2, mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Session Timeout (minutes)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LockIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                  <Slider
                    value={settings.sessionTimeout}
                    onChange={handleSliderChange('sessionTimeout')}
                    step={5}
                    marks
                    min={5}
                    max={60}
                    valueLabelDisplay="auto"
                    sx={{ maxWidth: 250 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Automatically log out after this period of inactivity.
                </Typography>
              </Box>
            </FormGroup>
          </Paper>
        </Grid>
        
        {/* Display Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PaletteIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Display
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Theme</FormLabel>
              <RadioGroup
                name="theme"
                value={settings.theme}
                onChange={handleInputChange}
                row
              >
                <FormControlLabel value="light" control={<Radio />} label="Light" />
                <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                <FormControlLabel value="system" control={<Radio />} label="System default" />
              </RadioGroup>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                id="language"
                name="language"
                value={settings.language}
                label="Language"
                onChange={handleInputChange}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="zh">Chinese</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Font Size
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ mr: 1 }}>Small</Typography>
                <Slider
                  value={settings.fontSize}
                  onChange={handleSliderChange('fontSize')}
                  step={1}
                  min={12}
                  max={20}
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 250, mx: 1 }}
                />
                <Typography variant="caption" sx={{ ml: 1 }}>Large</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Data Management Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <StorageIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Data Management
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormGroup>
                  <FormControlLabel 
                    control={
                      <Switch 
                        checked={settings.autoBackup} 
                        onChange={handleToggleChange} 
                        name="autoBackup" 
                      />
                    } 
                    label="Automatic data backup" 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 2 }}>
                    Automatically create backups of your data.
                  </Typography>
                  
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Data Retention Period (days)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      <Slider
                        value={settings.dataRetention}
                        onChange={handleSliderChange('dataRetention')}
                        step={30}
                        marks
                        min={30}
                        max={365}
                        valueLabelDisplay="auto"
                        sx={{ maxWidth: 300 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      How long to keep log data and activity history.
                    </Typography>
                  </Box>
                </FormGroup>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Data Export
                </Typography>
                
                <List>
                  <ListItem button>
                    <ListItemIcon>
                      <StorageIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Export Patient Data" 
                      secondary="Download all patient records in CSV format" 
                    />
                  </ListItem>
                  
                  <ListItem button>
                    <ListItemIcon>
                      <StorageIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Export Activity Logs" 
                      secondary="Download activity logs and audit trail" 
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};

export default Settings; 