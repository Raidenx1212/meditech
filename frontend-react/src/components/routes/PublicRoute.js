import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../../services/api.service';

/**
 * A wrapper for public routes (like login/register)
 * If user is already authenticated, redirect to dashboard
 */
const PublicRoute = ({ children }) => {
  const location = useLocation();
  
  // Check if we're coming from register page to login
  // In this case, don't redirect even if there's a token
  const isFromRegister = location.pathname === '/login' && 
                         location.state && 
                         location.state.message && 
                         location.state.message.includes('Registration successful');
  
  // Check for authentication using direct token check
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  
  // If authenticated and trying to access /login, redirect to dashboard
  if (isAuthenticated && location.pathname === '/login' && !isFromRegister) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not authenticated or if we're showing login after register, render the child component
  return children;
};

export default PublicRoute; 