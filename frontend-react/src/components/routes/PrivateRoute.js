import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../../services/api.service';

/**
 * A wrapper for routes that require authentication
 * If user is not authenticated, redirect to login page
 */
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  
  // Check for authentication using AuthService
  const isAuthenticated = AuthService.isAuthenticated();
  
  // If not authenticated, save current location and redirect to login
  if (!isAuthenticated) {
    // Save the current location for redirect after login
    sessionStorage.setItem('redirect_after_login', location.pathname);
    
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the child component
  return children;
};

export default PrivateRoute; 