import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { clearAllAuthData } from '../services/auth-cleanup';

/**
 * Hook to clean up auth sessions on specific routes
 * This ensures no automatic login can happen on protected paths
 */
const useSessionCleanup = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Paths that should always clear session data
    const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    
    // Check if current path is in the list of auth paths
    if (authPaths.includes(location.pathname)) {
      console.log(`Path ${location.pathname} requires session cleanup`);
      clearAllAuthData();
    }
  }, [location.pathname]);
  
  return null;
};

export default useSessionCleanup; 