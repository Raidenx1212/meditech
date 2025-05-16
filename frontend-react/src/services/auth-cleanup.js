/**
 * Utility functions for authentication cleanup
 * Used to ensure sessions are properly cleared and prevent auto-login
 */

/**
 * Clears all authentication-related data from both localStorage and sessionStorage
 * @returns {boolean} Success status
 */
export const clearAllAuthData = () => {
  try {
    // Define all possible auth-related items to clean up
    const authItems = [
      'token', 'user', 'walletAddress', 'web3Connected', 
      'saved_email', 'saved_password', 'remember_preference',
      'redirect_after_login', 'isDisconnected', 'lastChainId',
      'rohan_doctor_id', 'loginTimestamp', 'authRefresh'
    ];
    
    console.log('Clearing all authentication data');
    
    // Clear from localStorage
    authItems.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear from sessionStorage
    authItems.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    // Also clear any unspecified items that might exist
    if (window.localStorage) {
      const keysToRemove = [];
      for(let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('token') || 
          key.includes('user') || 
          key.includes('wallet') || 
          key.includes('auth')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove outside the loop to avoid index shifting issues
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

/**
 * Verifies whether any auth session exists and removes it if force=true
 * @param {boolean} force Whether to force removal of any found session
 * @returns {boolean} Whether a session was found
 */
export const checkForExistingSession = (force = false) => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const walletAddress = localStorage.getItem('walletAddress');
    
    const hasSession = !!(token || user || walletAddress);
    
    if (hasSession && force) {
      clearAllAuthData();
    }
    
    return hasSession;
  } catch (error) {
    console.error('Error checking for existing session:', error);
    return false;
  }
};

export default {
  clearAllAuthData,
  checkForExistingSession
}; 