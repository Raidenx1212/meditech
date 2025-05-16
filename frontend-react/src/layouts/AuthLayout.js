import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  LocalHospital,
  Menu as MenuIcon,
} from '@mui/icons-material';

const AuthLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = React.useState(null);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleNavigate = (path) => {
    handleMobileMenuClose();
    navigate(path);
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main Navigation */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'  
      }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalHospital sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 30 }} />
              <Typography 
                variant="h5" 
                component={Link} 
                to="/" 
                sx={{ 
                  color: theme.palette.primary.main, 
                  textDecoration: 'none',
                  fontWeight: 'bold' 
                }}
              >
                MediTech
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isMobile ? (
                <>
                  <IconButton
                    color="inherit"
                    aria-label="menu"
                    onClick={handleMobileMenuOpen}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Menu
                    anchorEl={mobileMenuAnchorEl}
                    open={Boolean(mobileMenuAnchorEl)}
                    onClose={handleMobileMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={() => handleNavigate('/')}>HOME</MenuItem>
                    <MenuItem onClick={() => handleNavigate('/login')}>LOGIN</MenuItem>
                    <MenuItem onClick={() => handleNavigate('/register')}>REGISTER</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/"
                    sx={{ 
                      fontWeight: location.pathname === '/' ? 'bold' : 'normal',
                      borderBottom: location.pathname === '/' ? 2 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      mx: 1
                    }}
                  >
                    HOME
                  </Button>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/login"
                    sx={{ 
                      fontWeight: location.pathname === '/login' ? 'bold' : 'normal',
                      borderBottom: location.pathname === '/login' ? 2 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      mx: 1
                    }}
                  >
                    LOGIN
                  </Button>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/register"
                    sx={{ 
                      fontWeight: location.pathname === '/register' ? 'bold' : 'normal',
                      borderBottom: location.pathname === '/register' ? 2 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 0,
                      mx: 1
                    }}
                  >
                    REGISTER
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flexGrow: 1,
          py: 4,
          backgroundImage: 'url("/images/medical-bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            zIndex: 0
          }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.grey[100],
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} MediTech. All rights reserved.
            </Typography>
            <Box>
              <Button 
                component={Link}
                to="/terms"
                color="inherit"
                size="small"
                sx={{ mr: 2, fontSize: '0.875rem' }}
              >
                Terms
              </Button>
              <Button 
                component={Link}
                to="/privacy"
                color="inherit"
                size="small"
                sx={{ mr: 2, fontSize: '0.875rem' }}
              >
                Privacy
              </Button>
              <Button 
                component={Link}
                to="/contact"
                color="inherit"
                size="small"
                sx={{ fontSize: '0.875rem' }}
              >
                Contact
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout; 