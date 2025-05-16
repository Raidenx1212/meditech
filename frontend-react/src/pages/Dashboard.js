import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  LocalHospital as LocalHospitalIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon,
  Event as EventIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Mock data for dashboard
  const stats = [
    { title: 'Total Patients', value: 1284, icon: <PeopleIcon />, change: '+12%', color: '#1976d2' },
    { title: 'Appointments Today', value: 42, icon: <CalendarIcon />, change: '+5%', color: '#2e7d32' },
    { title: 'New Patients (Monthly)', value: 68, icon: <PersonAddIcon />, change: '+18%', color: '#ed6c02' },
    { title: 'Active Records', value: 958, icon: <AssignmentIcon />, change: '+3%', color: '#0288d1' }
  ];
  
  const recentActivities = [
    { 
      id: 1, 
      type: 'New Patient', 
      description: 'Emily Johnson registered as a new patient',
      time: '20 minutes ago',
      avatar: '/avatar1.jpg', 
      color: '#1976d2' 
    },
    { 
      id: 2, 
      type: 'Appointment', 
      description: 'Dr. Williams completed appointment with James Smith',
      time: '1 hour ago',
      avatar: '/avatar2.jpg', 
      color: '#2e7d32' 
    },
    { 
      id: 3, 
      type: 'Lab Results', 
      description: 'Blood test results updated for Michael Brown',
      time: '3 hours ago',
      avatar: '/avatar3.jpg', 
      color: '#ed6c02' 
    },
    { 
      id: 4, 
      type: 'Medical Record', 
      description: 'Dr. Miller added a new medical record for Robert Davis',
      time: '5 hours ago',
      avatar: '/avatar4.jpg', 
      color: '#0288d1' 
    }
  ];
  
  const upcomingAppointments = [
    { 
      id: 1, 
      patientName: 'Sarah Thompson', 
      time: '10:00 AM', 
      type: 'Follow-up', 
      status: 'confirmed',
      avatar: '/avatar5.jpg',
    },
    { 
      id: 2, 
      patientName: 'David Wilson', 
      time: '11:30 AM', 
      type: 'Consultation', 
      status: 'confirmed',
      avatar: '/avatar6.jpg',
    },
    { 
      id: 3, 
      patientName: 'Jennifer Garcia', 
      time: '1:15 PM', 
      type: 'Check-up', 
      status: 'pending',
      avatar: '/avatar7.jpg',
    },
    { 
      id: 4, 
      patientName: 'Thomas Martinez', 
      time: '3:45 PM', 
      type: 'Lab Review', 
      status: 'confirmed',
      avatar: '/avatar8.jpg',
    }
  ];
  
  // Data for the chart (simplified for this example)
  const patientsByDepartment = {
    labels: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'],
    values: [125, 98, 156, 104, 182]
  };
  
  // Calculate the maximum value to set as the reference for 100%
  const maxDepartmentValue = Math.max(...patientsByDepartment.values);
  
  // System health indicators
  const systemHealth = [
    { metric: 'Database Performance', value: 92, status: 'good' },
    { metric: 'API Response Time', value: 87, status: 'good' },
    { metric: 'System Uptime', value: 99.8, status: 'excellent' },
    { metric: 'Storage Usage', value: 68, status: 'normal' }
  ];
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Welcome to MediTech
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Dashboard overview and summary
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          component={Link}
          to="/patients/new"
        >
          New Patient
        </Button>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 5,
                  backgroundColor: stat.color,
                }
              }}
              elevation={1}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {stat.title}
                </Typography>
                <Avatar
                  sx={{
                    backgroundColor: `${stat.color}20`,
                    color: stat.color,
                    width: 40,
                    height: 40
                  }}
                >
                  {stat.icon}
                </Avatar>
              </Box>
              
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                {stat.value}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  {stat.change} from last month
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Patient Distribution by Department */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Patients by Department</Typography>
              <Button endIcon={<ArrowForwardIcon />} size="small">View All</Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box>
              {patientsByDepartment.labels.map((label, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{label}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {patientsByDepartment.values[index]}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(patientsByDepartment.values[index] / maxDepartmentValue) * 100} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 5,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        backgroundColor: index % 2 === 0 ? 'primary.main' : 'secondary.main',
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
          
          {/* Recent Activity */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Activity</Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {recentActivities.map((activity) => (
                <ListItem
                  key={activity.id}
                  alignItems="flex-start"
                  sx={{ px: 0, py: 1.5 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${activity.color}20`, color: activity.color }}>
                      {activity.type === 'New Patient' && <PersonAddIcon />}
                      {activity.type === 'Appointment' && <CalendarIcon />}
                      {activity.type === 'Lab Results' && <LocalHospitalIcon />}
                      {activity.type === 'Medical Record' && <AssignmentIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2" component="span">
                          {activity.description}
                        </Typography>
                        <Chip 
                          label={activity.type} 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            backgroundColor: `${activity.color}20`, 
                            color: activity.color,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }} 
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" component="span">
                        {activity.time}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" size="small" endIcon={<ArrowForwardIcon />}>
                View All Activity
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Today's Appointments */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Today's Appointments</Typography>
              <Chip
                icon={<EventIcon sx={{ fontSize: '16px !important' }} />}
                label={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ px: 0 }}>
              {upcomingAppointments.map((appointment) => (
                <ListItem
                  key={appointment.id}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.default',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  secondaryAction={
                    <IconButton edge="end" size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      alt={appointment.patientName} 
                      src={appointment.avatar}
                      sx={{ width: 40, height: 40 }}
                    >
                      {appointment.patientName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap>
                        {appointment.patientName}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            mr: 1
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 12, mr: 0.5 }} />
                          {appointment.time}
                        </Typography>
                        <Chip
                          label={appointment.type}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            fontWeight: 500,
                            bgcolor: appointment.type === 'Consultation' 
                              ? 'rgba(25, 118, 210, 0.1)' 
                              : appointment.type === 'Lab Review'
                                ? 'rgba(237, 108, 2, 0.1)'
                                : 'rgba(46, 125, 50, 0.1)',
                            color: appointment.type === 'Consultation' 
                              ? 'primary.main' 
                              : appointment.type === 'Lab Review'
                                ? 'warning.main'
                                : 'success.main',
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="text" 
                color="primary" 
                sx={{ textTransform: 'none' }}
                component={Link}
                to="/appointments"
              >
                View Full Schedule
              </Button>
            </Box>
          </Paper>
          
          {/* System Health Card */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">System Health</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {systemHealth.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2">{item.metric}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
                      {item.value}%
                    </Typography>
                    <CheckCircleIcon 
                      sx={{ 
                        fontSize: 16, 
                        color: item.status === 'excellent' 
                          ? 'success.main' 
                          : item.status === 'good' 
                            ? 'primary.main' 
                            : 'warning.main'
                      }} 
                    />
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={item.value} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: 
                        item.status === 'excellent' ? 'success.main' :
                        item.status === 'good' ? 'primary.main' : 'warning.main',
                    }
                  }}
                />
              </Box>
            ))}
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Last updated: Today at 10:24 AM
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 