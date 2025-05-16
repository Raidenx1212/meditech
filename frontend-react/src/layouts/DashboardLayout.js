import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  Container,
  Tooltip,
  Badge,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  AssignmentInd as AssignmentIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  AccountCircle,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  QuestionAnswer as FAQIcon,
  Article as BlogIcon,
  Notifications as NotificationsIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { AuthService } from '../services/api.service';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ArticleIcon from '@mui/icons-material/Article';

const drawerWidth = 260;

// Role-based sidebar navigation
const sidebarNav = {
  doctor: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Patient Records', icon: <AssignmentIndIcon />, path: '/patients' },
    { text: 'View Appointments', icon: <EventIcon />, path: '/appointments' },
    { text: 'Confirmed Docs', icon: <CheckCircleIcon />, path: '/documents/confirmed' },
    { divider: true },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { divider: true },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
    { text: 'FAQ', icon: <QuestionAnswerIcon />, path: '/faq' },
    { text: 'Blog', icon: <ArticleIcon />, path: '/blog' },
  ],
  admin: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Patient Records', icon: <AssignmentIndIcon />, path: '/patients' },
    { text: 'Admin Panel', icon: <SettingsIcon />, path: '/admin' },
    { divider: true },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { divider: true },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
    { text: 'FAQ', icon: <QuestionAnswerIcon />, path: '/faq' },
    { text: 'Blog', icon: <ArticleIcon />, path: '/blog' },
  ],
  patient: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Patient Records', icon: <AssignmentIndIcon />, path: '/patients' },
    { text: 'Book Appt.', icon: <EventIcon />, path: '/appointments/book' },
    { text: 'Pending Updates', icon: <NotificationsIcon />, path: '/updates/pending' },
    { divider: true },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { divider: true },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
    { text: 'FAQ', icon: <QuestionAnswerIcon />, path: '/faq' },
    { text: 'Blog', icon: <ArticleIcon />, path: '/blog' },
  ],
};

const DashboardLayout = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await AuthService.getCurrentUser();
        const userData = response?.user || response?.data?.user || response?.data || null;
        setUser(userData);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // Menu handler functions
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  // Determine sidebar items based on user role
  const navItems = user && user.role ? sidebarNav[user.role] || sidebarNav['patient'] : [];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: '0 2px 10px 0 rgba(0,0,0,0.1)',
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 2,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HospitalIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: 'none', md: 'flex' }, fontWeight: 'bold' }}
            >
              MediTech
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationsMenuOpen}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Account */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                U
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {/* User profile menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>Profile</MenuItem>
        <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>Settings</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsMenuClose}
      >
        <MenuItem onClick={handleNotificationsMenuClose}>New patient record added</MenuItem>
        <MenuItem onClick={handleNotificationsMenuClose}>System update completed</MenuItem>
        <MenuItem onClick={handleNotificationsMenuClose}>New message from admin</MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationsMenuClose}>
          <Typography variant="body2" color="primary">See all notifications</Typography>
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            ...(!open && {
              overflowX: 'hidden',
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              width: theme.spacing(7),
            }),
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <HospitalIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary" fontWeight="bold">
              MediTech
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          {navItems.map((item, idx) =>
            item.divider ? (
              <Divider key={idx} sx={{ my: 1 }} />
            ) : (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: open ? 1 : 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default DashboardLayout; 