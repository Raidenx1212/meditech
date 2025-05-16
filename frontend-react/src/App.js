import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Layouts
import DashboardLayout from 'layouts/DashboardLayout';
import AuthLayout from 'layouts/AuthLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import PatientRecords from './pages/PatientRecords';
import PatientDetail from './pages/PatientDetail';
import NewPatient from './pages/NewPatient';
import ProfilePage from './pages/ProfilePage';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';
import FAQ from './pages/FAQ';
import Blog from './pages/Blog';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import BookAppointment from './pages/BookAppointment';
import ViewAppointment from './pages/ViewAppointment';
import ConfirmedDocumentChanges from './pages/ConfirmedDocumentChanges';
import MedicalRecords from './pages/MedicalRecords';
import PendingUpdates from './pages/PendingUpdates';
import PatientView from './pages/PatientView';
import AdminPanel from './pages/AdminPanel';

// Diagnostic Tools
import ConnectionTest from './components/ConnectionTest';

// Route Guards
import PrivateRoute from 'components/routes/PrivateRoute';
import PublicRoute from 'components/routes/PublicRoute';

// Add session cleanup utilities
import { clearAllAuthData } from './services/auth-cleanup';
import useSessionCleanup from './hooks/useSessionCleanup';

// AppContent component that includes session cleanup
const AppContent = () => {
  // Use session cleanup hook to ensure auth paths clear sessions
  useSessionCleanup();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients">
          <Route index element={<PatientRecords />} />
          <Route path="new" element={<NewPatient />} />
          <Route path=":id" element={<PatientDetail />} />
          <Route path="view/:id" element={<PatientView />} />
        </Route>
        <Route path="/appointments/book" element={<BookAppointment />} />
        <Route path="/appointments" element={<ViewAppointment />} />
        <Route path="/documents/confirmed" element={<ConfirmedDocumentChanges />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/updates/pending" element={<PendingUpdates />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Diagnostic Routes */}
        <Route path="/diagnostics/connection" element={<ConnectionTest />} />
      </Route>
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  // Effect to clear storage on app initialization
  useEffect(() => {
    // Check URL parameters for forced cleanup
    const queryParams = new URLSearchParams(window.location.search);
    const forceLogout = queryParams.get('logout') === 'true';
    
    if (forceLogout) {
      // Force cleanup and remove query param
      clearAllAuthData();
      
      // Remove the query parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const theme = createTheme({
    palette: {
      primary: {
        light: '#4da3ff',
        main: '#1976d2',
        dark: '#115293',
        contrastText: '#fff',
      },
      secondary: {
        light: '#ff6090',
        main: '#e91e63',
        dark: '#b0003a',
        contrastText: '#fff',
      },
      background: {
        default: '#f9fafb',
        paper: '#ffffff',
      },
      success: {
        main: '#2e7d32',
      },
      info: {
        main: '#0288d1',
      },
      warning: {
        main: '#ed6c02',
      },
    },
    typography: {
      fontFamily: [
        'Poppins',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif'
      ].join(','),
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
