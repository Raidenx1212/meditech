import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  BookOnline as BookIcon,
  InsertDriveFile as FileIcon,
  LiveHelp as LiveHelpIcon,
  Chat as ChatIcon,
  ContactSupport as SupportIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

const HelpSupport = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
    attachment: null
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSupportForm({
      ...supportForm,
      [name]: value
    });
    
    // Clear field error when user starts typing again
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // Clear success message when form changes
    if (success) {
      setSuccess(false);
    }
  };

  const handleFileChange = (e) => {
    setSupportForm({
      ...supportForm,
      attachment: e.target.files[0]
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!supportForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!supportForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(supportForm.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!supportForm.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!supportForm.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!supportForm.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (supportForm.message.trim().length < 10) {
      newErrors.message = 'Message is too short';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      
      try {
        // In a real application, this would be an API call to submit a support ticket
        // await submitSupportTicket(supportForm);
        
        // For demo purposes, simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSuccess(true);
        
        // Reset form
        setSupportForm({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: '',
          attachment: null
        });
      } catch (error) {
        console.error('Error submitting support ticket:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // FAQ data
  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'To reset your password, go to the Login page and click on "Forgot Password". Enter your email address and follow the instructions sent to your email.'
    },
    {
      question: 'How can I create a new patient record?',
      answer: 'You can create a new patient record by navigating to the Patient Records page and clicking on the "New Patient" button. Fill in the required information and click "Save Patient" to create the record.'
    },
    {
      question: 'How to enable two-factor authentication?',
      answer: 'You can enable two-factor authentication by going to the Settings page, then to the Security tab. Toggle the "Two-factor authentication" switch to on, and follow the setup instructions.'
    },
    {
      question: 'How can I export my patient data?',
      answer: 'To export patient data, go to the Settings page, then to the Data Management section. Click on the "Export Patient Data" option and select your preferred format (CSV or PDF).'
    },
    {
      question: 'How do I add a new medical record for a patient?',
      answer: 'To add a new medical record, first navigate to the patient\'s profile by clicking on their name in the Patient Records list. Then click on "Add Record" and fill in the required information.'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Help & Support
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your support ticket has been submitted successfully! Our team will get back to you soon.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Quick Help Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              How can we help you today?
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }} elevation={2}>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <ArticleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" align="center" gutterBottom>
                        Documentation
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Access user guides and documentation
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button size="small" color="primary">
                      View Docs
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }} elevation={2}>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <LiveHelpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" align="center" gutterBottom>
                        FAQs
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Browse frequently asked questions
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button 
                      size="small" 
                      color="primary" 
                      component={Link} 
                      href="/faq"
                    >
                      View FAQs
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }} elevation={2}>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <ChatIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" align="center" gutterBottom>
                        Live Chat
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Chat with our support team
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button size="small" color="primary">
                      Start Chat
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }} elevation={2}>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <SupportIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" align="center" gutterBottom>
                        Support Ticket
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Submit a support request
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button 
                      size="small" 
                      color="primary"
                      href="#support-form"
                    >
                      Submit Ticket
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* FAQs Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <HelpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">
                Frequently Asked Questions
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {faqs.map((faq, index) => (
              <Accordion key={index} elevation={0}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`faq-content-${index}`}
                  id={`faq-header-${index}`}
                >
                  <Typography variant="subtitle1" fontWeight="medium">
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
            
            <Box mt={2} display="flex" justifyContent="center">
              <Button 
                variant="outlined" 
                color="primary"
                component={Link}
                href="/faq"
              >
                View All FAQs
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PhoneIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">
                Contact Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Phone Support"
                  secondary="+1 (800) 123-4567 (Mon-Fri, 9AM-5PM EST)"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <EmailIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Email Support"
                  secondary="support@healthledger.com"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BookIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Schedule a Demo"
                  secondary="Book a 30-minute demo with our product specialists"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <FileIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Technical Documentation"
                  secondary="Access developer resources and API documentation"
                />
              </ListItem>
            </List>
            
            <Typography variant="subtitle2" mt={2}>
              Business Hours:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monday - Friday: 9:00 AM - 5:00 PM (EST)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Weekend support available for emergencies only
            </Typography>
          </Paper>
        </Grid>
        
        {/* Support Ticket Form */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }} id="support-form">
            <Box display="flex" alignItems="center" mb={2}>
              <SupportIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">
                Submit a Support Ticket
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={supportForm.name}
                    onChange={handleInputChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={supportForm.email}
                    onChange={handleInputChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={supportForm.subject}
                    onChange={handleInputChange}
                    error={!!errors.subject}
                    helperText={errors.subject}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!errors.category} required>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={supportForm.category}
                      label="Category"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="account">Account Issues</MenuItem>
                      <MenuItem value="technical">Technical Problems</MenuItem>
                      <MenuItem value="billing">Billing Inquiries</MenuItem>
                      <MenuItem value="feature">Feature Requests</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                    {errors.category && <Typography color="error" variant="caption">{errors.category}</Typography>}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    name="message"
                    multiline
                    rows={4}
                    value={supportForm.message}
                    onChange={handleInputChange}
                    error={!!errors.message}
                    helperText={errors.message}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    component="label"
                  >
                    Attach File
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  {supportForm.attachment && (
                    <Typography variant="caption" sx={{ ml: 2 }}>
                      File selected: {supportForm.attachment.name}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Submitting...' : 'Submit Ticket'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HelpSupport; 