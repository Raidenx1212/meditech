import axios from 'axios';
import Web3Service from './web3.service';

// Get the base API URL from environment variables or use the local URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

console.log('API Service Initialization:');
console.log('- API_URL:', API_URL);
console.log('- BACKEND_URL:', BACKEND_URL);

// Create an Axios instance with defaults
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 seconds
  withCredentials: false // Disable credentials for simpler CORS handling
});

// Clear all authentication data from both storages
const clearAllAuthData = () => {
  try {
    // Clear specific auth-related items
    const authItems = [
      'token', 'user', 'walletAddress', 'web3Connected', 
      'saved_email', 'saved_password', 'remember_preference',
      'redirect_after_login'
    ];
    
    authItems.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

// Check connection to backend
const checkBackendConnection = async () => {
  try {
    console.log('Checking backend connection...');
    const response = await axios({
      method: 'GET',
      url: `${BACKEND_URL}/health`,
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Backend connection successful');
      return true;
    }
    console.warn('⚠️ Backend connection issue - Status:', response.status);
    return false;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
};

// Add a request interceptor to attach the token to every request
API.interceptors.request.use(
  (config) => {
    // Check if this is a patient-related API call
    const isPatientRoute = config.url && (
      config.url.includes('/patients') || 
      config.url.startsWith('patients')
    );
    
    if (isPatientRoute) {
      console.log(`Making request to patient API: ${config.url} [${config.method}]`);
    }
    
    if (AuthService.isAuthenticated()) {
      const token = localStorage.getItem('token');
      config.headers['Authorization'] = `Bearer ${token}`;
      
      if (isPatientRoute) {
        console.log('Token is valid, request authenticated');
      }
    } else {
      // If token exists but is invalid (expired), clear it
      const token = localStorage.getItem('token');
      if (token) {
        console.warn('Token exists but appears to be invalid - cleaning up');
        clearAllAuthData();
        
        if (isPatientRoute) {
          console.warn('Patient API call with invalid token');
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common error scenarios
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          console.warn('Authentication expired or invalid - redirecting to login');
          
          // Save current location to redirect back after login
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            // Check for special routes that need precise handling
            if (currentPath === '/patients/new') {
              sessionStorage.setItem('redirect_after_login', '/patients/new');
            } else {
              sessionStorage.setItem('redirect_after_login', currentPath);
            }
          }
          
          // Only clear data and redirect if we're not already on the login page
          if (window.location.pathname !== '/login') {
            AuthService.logout();
            window.location.href = '/login?session_expired=true';
          }
          break;
        case 403:
          console.warn('Authorization error: Forbidden access');
          break;
        case 404:
          console.warn('Resource not found:', error.config.url);
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error(`HTTP Error ${error.response.status}:`, error.response.data);
      }
    } else if (error.request) {
      console.error('Network error - No response received');
      checkBackendConnection(); // Check backend availability
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Authentication Service
const AuthService = {
  login: async (email, password, walletAddress = null) => {
    try {
      // First validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Get connected wallet address if not provided
      if (!walletAddress) {
        walletAddress = Web3Service.getCurrentAddress();
        if (!walletAddress) {
          // Attempt to connect the wallet if it's not already connected
          try {
            walletAddress = await Web3Service.connectWallet();
          } catch (walletError) {
            console.error('Error connecting wallet:', walletError);
            throw new Error('Please connect your MetaMask wallet first');
          }
        }
      }

      if (!walletAddress) {
        throw new Error('Please connect your MetaMask wallet first');
      }
      
      walletAddress = walletAddress.trim().toLowerCase();
      console.log('Logging in with wallet:', walletAddress);
      
      // Clear any existing auth data before login to prevent conflicts
      clearAllAuthData();
      
      // Make the API call
      const response = await API.post('/auth/login', { 
        email, 
        password,
        walletAddress 
      });
      
      // Different API response formats may contain token in different places
      // Check all possible locations
      let token = null;
      let user = null;
      
      if (response.data) {
        if (response.data.token) {
          token = response.data.token;
          user = response.data.user || {};
        } else if (response.data.accessToken) {
          token = response.data.accessToken;
          user = response.data.user || {};
        } else if (response.data.data && response.data.data.token) {
          token = response.data.data.token;
          user = response.data.data.user || {};
        }
      }
      
      // Check if we got a token
      if (!token) {
        console.error('No authentication token received. API response:', response.data);
        throw new Error('No authentication token received from server');
      }
      
      // Add wallet address to user data before storing
      user.walletAddress = walletAddress;
      
      // Store the user data
      AuthService.storeUserData(token, user);
      
      // Return normalized response
      return {
        data: {
          success: true,
          token: token,
          user: user,
          message: 'Login successful'
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  checkEmailWallet: async (email) => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      const response = await API.get('/auth/check-email-wallet', {
        params: { email }
      });
      
      return response;
    } catch (error) {
      console.error('Check email wallet error:', error.message);
      throw error;
    }
  },
  
  checkWalletAddress: async (walletAddress) => {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }
      
      const response = await API.get('/auth/check-wallet', {
        params: { walletAddress }
      });
      
      return response;
    } catch (error) {
      console.error('Check wallet error:', error.message);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      // First check if the wallet is already registered
      if (userData.walletAddress) {
        try {
          const walletCheck = await API.get('/auth/check-wallet', {
            params: { walletAddress: userData.walletAddress }
          });
          
          if (walletCheck.data?.success) {
            throw new Error(JSON.stringify({
              response: {
                status: 409,
                data: {
                  success: false,
                  message: `This wallet address is already registered with email ${walletCheck.data.email}. Please use that email to log in.`,
                  code: 'WALLET_ALREADY_EXISTS'
                }
              }
            }));
          }
        } catch (walletError) {
          // Only rethrow if this was our custom error
          if (walletError.response?.data?.code === 'WALLET_ALREADY_EXISTS') {
            throw walletError;
          }
          // Otherwise continue with registration (404 is expected if wallet isn't registered)
        }
      }
      
      // Now proceed with the registration
      const response = await API.post('/auth/register', userData);
      
      // Do NOT store any auth data here
      // User must explicitly log in after registration
      return response;
    } catch (error) {
      console.error('Registration error:', error.message);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }
      const response = await API.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error.message);
      return null;
    }
  },
  
  // Get the current user role from localStorage
  getUserRole: () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        return null;
      }
      const user = JSON.parse(userString);
      return user.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },
  
  // Check if the current user is a patient
  isPatient: () => {
    const role = AuthService.getUserRole();
    return role === 'patient';
  },
  
  // Check if the current user is a doctor
  isDoctor: () => {
    const role = AuthService.getUserRole();
    return role === 'doctor';
  },
  
  // Check if the current user is an admin
  isAdmin: () => {
    const role = AuthService.getUserRole();
    return role === 'admin';
  },
  
  logout: () => {
    try {
      API.post('/auth/logout').catch(err => {
        // Just log the error but continue with client-side logout
        console.warn('Error during server logout:', err.message);
      });
    } catch (error) {
      console.warn('Logout error:', error.message);
    } finally {
      clearAllAuthData(); // Use the function to clear all auth data
      
      // Clear wallet address if stored
      try {
        localStorage.removeItem('walletAddress');
      } catch (err) {
        console.warn('Error clearing wallet address:', err);
      }
    }
    return true;
  },
  
  storeUserData: (token, user) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store wallet address if available in user data
      if (user.walletAddress) {
        localStorage.setItem('walletAddress', user.walletAddress);
        console.log('Stored wallet address:', user.walletAddress);
      } else {
        console.warn('No wallet address found in user data');
      }
      
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    try {
      // JWT tokens are in format: header.payload.signature
      const payload = token.split('.')[1];
      if (!payload) return false;
      
      // Decode the base64 payload
      const decodedPayload = JSON.parse(atob(payload));
      
      // Check if token has an expiration time
      if (decodedPayload.exp) {
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        return decodedPayload.exp > currentTime; // Token is valid if not expired
      }
      
      return true; // No expiration found, assume valid
    } catch (error) {
      console.error('Error validating token:', error);
      return false; // Invalid token format
    }
  },

  updateProfile: async (profileData) => {
    try {
      // Send updated profile data to backend
      const response = await API.put('/auth/me', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      // Send current and new password to backend
      const response = await API.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error.message);
      throw error;
    }
  },

  getRegisteredEmail: async (walletAddress) => {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }
      const response = await API.get(`/auth/check-wallet?walletAddress=${walletAddress}`);
      return response.data?.fullEmail || null;
    } catch (error) {
      console.error('Error getting registered email:', error);
      if (error.response?.status === 404) {
        return null; // Wallet not registered
      }
      throw error;
    }
  }
};

// Patient Services
const PatientService = {
  getAllPatients: async (page = 1, limit = 10) => {
    console.log('PatientService: Fetching all patients', { page, limit });
    try {
      const response = await API.get('/patients', { params: { page, limit } });
      console.log('PatientService: Got response', response.data);
      return response;
    } catch (error) {
      console.error('PatientService: Error fetching patients', error.message);
      console.error('PatientService: Response data:', error.response?.data);
      throw error;
    }
  },
  
  getPatientById: async (id) => {
    console.log('PatientService: Fetching patient by ID', id);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Make API request with explicit auth header
      const response = await axios.get(`${API_URL}/patients/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('PatientService: Patient detail response received');
      return response;
    } catch (error) {
      console.error('PatientService: Error fetching patient details', error.message);
      console.error('PatientService: Response data:', error.response?.data);
      throw error;
    }
  },
  
  createPatient: async (patientData) => {
    try {
      // Check if authenticated before making the request
      if (!AuthService.isAuthenticated()) {
        console.error('PatientService: Authentication required');
        throw new Error(JSON.stringify({
          response: {
            status: 401,
            data: {
              success: false,
              message: 'Authentication required. Please login again.'
            }
          }
        }));
      }
      
      // Check if user is a patient
      if (!AuthService.isPatient()) {
        console.error('PatientService: User is not a patient');
        throw new Error(JSON.stringify({
          response: {
            status: 403,
            data: {
              success: false,
              message: 'Only patients can register new patients. Access denied.'
            }
          }
        }));
      }
      
      console.log('PatientService: Creating patient with data:', {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        email: patientData.email,
        // Exclude sensitive fields from logs
        contactNumber: patientData.contactNumber ? '[REDACTED]' : undefined,
        address: patientData.address ? '[REDACTED]' : undefined
      });
      
      // Ensure token is included in the request
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('PatientService: No authentication token found');
        throw new Error(JSON.stringify({
          response: {
            status: 401,
            data: {
              success: false,
              message: 'No authentication token found. Please login again.'
            }
          }
        }));
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      // Validate required fields before sending to the server
      const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber'];
      const missingFields = requiredFields.filter(field => !patientData[field]);
      
      if (missingFields.length > 0) {
        console.error('PatientService: Missing required fields:', missingFields);
        throw new Error(JSON.stringify({
          response: {
            status: 400,
            data: {
              success: false,
              message: `Missing required fields: ${missingFields.join(', ')}`,
              errors: missingFields.map(field => `${field} is required`)
            }
          }
        }));
      }
      
      // Make the API call with explicit timeout and retry logic
      try {
        const response = await API.post('/patients', patientData, { 
          headers,
          timeout: 15000 // 15 seconds timeout
        });
        console.log('PatientService: Patient created successfully', response.data);
        return response;
      } catch (apiError) {
        // Check if it's a network error and retry once
        if (apiError.message && apiError.message.includes('timeout') || 
            apiError.message && apiError.message.includes('Network Error')) {
          console.warn('PatientService: Network issue detected, retrying...');
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResponse = await API.post('/patients', patientData, { 
            headers,
            timeout: 20000 // Increased timeout for retry
          });
          console.log('PatientService: Patient created successfully on retry', retryResponse.data);
          return retryResponse;
        }
        throw apiError; // Re-throw if not a network error
      }
    } catch (error) {
      console.error('PatientService: Error creating patient:', error.message);
      
      // If error is due to token expiry or missing, redirect to login
      if (error.response?.status === 401) {
        console.warn('Authentication expired during patient creation');
        throw new Error(JSON.stringify({
          response: {
            status: 401,
            data: {
              success: false,
              message: 'Your session has expired. Please login again.'
            }
          }
        }));
      }
      
      // Handle 409 Conflict (duplicate email) or other errors
      if (error.response?.status === 409) {
        throw new Error(JSON.stringify({
          response: {
            status: 409,
            data: {
              success: false,
              message: error.response.data.message || 'A patient with this email already exists',
              code: error.response.data.code || 11000,
              field: error.response.data.field || 'email'
            }
          }
        }));
      }
      
      // Handle validation errors
      if (error.response?.status === 400) {
        throw new Error(JSON.stringify({
          response: {
            status: 400,
            data: {
              success: false,
              message: 'Please check the form for errors',
              errors: error.response.data.errors || []
            }
          }
        }));
      }
      
      // If this is a String-wrapped JSON error we created above, parse and re-throw
      if (error.message && error.message.startsWith('{') && error.message.endsWith('}')) {
        try {
          const parsedError = JSON.parse(error.message);
          throw new Error(JSON.stringify(parsedError));
        } catch (parseError) {
          // If parsing fails, continue with original error
        }
      }
      
      // Check for backend connectivity
      checkBackendConnection().then(isConnected => {
        if (!isConnected) {
          console.error('PatientService: Backend server is unreachable');
        }
      });
      
      // Handle other errors
      throw new Error(JSON.stringify({
        response: {
          status: error.response?.status || 500,
          data: {
            success: false,
            message: error.response?.data?.message || 'Failed to create patient. Server might be unavailable or there may be a network issue.'
          }
        }
      }));
    }
  },
  
  updatePatient: async (id, patientData) => {
    return API.put(`/patients/${id}`, patientData);
  },
  
  deletePatient: async (id) => {
    return API.delete(`/patients/${id}`);
  },

  getPendingDocuments: async (patientId) => {
    // Fetch the patient and return pendingDocuments
    const response = await API.get(`/patients/${patientId}`);
    return response.data?.patient?.pendingDocuments || [];
  },

  approvePendingDocument: async (patientId, docId) => {
    return API.post(`/patients/${patientId}/pending-documents/${docId}/approve`);
  },

  rejectPendingDocument: async (patientId, docId) => {
    return API.post(`/patients/${patientId}/pending-documents/${docId}/reject`);
  }
};

// Medical Record Services
const MedicalRecordService = {
  getAllRecords: async (params) => {
    return API.get('/medical-records', { params });
  },
  
  getPatientRecords: async (patientId, page = 1, limit = 10) => {
    console.log('MedicalRecordService: Fetching records for patient', patientId);
    try {
      const response = await API.get(`/patients/${patientId}/medical-records`, {
        params: { page, limit }
      });
      console.log('MedicalRecordService: Got response', response.data);
      return response;
    } catch (error) {
      console.error('MedicalRecordService: Error fetching records', error.message);
      throw error;
    }
  },
  
  getRecordById: async (recordId) => {
    return API.get(`/medical-records/${recordId}`);
  },
  
  createRecord: async (recordData) => {
    // Ensure patientId is included in the request
    if (!recordData.patientId) {
      throw new Error('Patient ID is required to create a medical record');
    }
    console.log('MedicalRecordService: Creating record for patient', recordData.patientId);
    return API.post('/medical-records', recordData);
  },
  
  updateRecord: async (recordId, recordData) => {
    return API.put(`/medical-records/${recordId}`, recordData);
  },
  
  deleteRecord: async (recordId) => {
    return API.delete(`/medical-records/${recordId}`);
  },
  
  getAccessLogs: async (recordId) => {
    return API.get(`/medical-records/${recordId}/access-logs`);
  },

  // Get all medical records for the current user or a specific patient
  getMedicalRecords: async (patientId) => {
    const url = patientId ? 
      `/medical-records/patient/${patientId}` : 
      '/medical-records';
    try {
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
  },

  // Get a single medical record by ID
  getMedicalRecord: async (id) => {
    try {
      const response = await API.get(`/medical-records/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching medical record ${id}:`, error);
      throw error;
    }
  },

  // Create a new medical record
  createMedicalRecord: async (recordData, documents) => {
    try {
      // Check if authenticated before making the request
      if (!AuthService.isAuthenticated()) {
        console.error('MedicalRecordService: Authentication required');
        return {
          success: false,
          message: 'Authentication required. Please login again.'
        };
      }

      // Ensure patientId is included
      if (!recordData.patientId) {
        console.error('MedicalRecordService: Missing patient ID');
        return {
          success: false,
          message: 'Patient ID is required to create a medical record'
        };
      }

      console.log('MedicalRecordService: Creating record with data:', {
        type: recordData.type,
        doctor: recordData.doctor,
        patientId: recordData.patientId,
        documentsCount: documents ? documents.length : 0
      });
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('MedicalRecordService: No authentication token found');
        return {
          success: false,
          message: 'No authentication token found. Please login again.'
        };
      }
      
      const commonHeaders = { 'Authorization': `Bearer ${token}` };
      
      // If documents are provided, use FormData to upload files
      if (documents && documents.length > 0) {
        const formData = new FormData();
        
        // Add record data to form data
        Object.keys(recordData).forEach(key => {
          if (recordData[key] !== undefined && recordData[key] !== null) {
            formData.append(key, recordData[key]);
          }
        });
        
        // Validate file sizes before uploading
        const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total limit
        const MAX_FILE_SIZE = 5 * 1024 * 1024;   // 5MB per file limit
        
        let totalSize = 0;
        const oversizedFiles = [];
        const validFiles = [];
        
        for (const doc of documents) {
          if (doc.size > MAX_FILE_SIZE) {
            oversizedFiles.push(`${doc.name} (${(doc.size / 1024 / 1024).toFixed(2)}MB)`);
          } else {
            totalSize += doc.size;
            validFiles.push(doc);
          }
        }
        
        if (oversizedFiles.length > 0) {
          return {
            success: false,
            message: `Some files exceed the 5MB size limit: ${oversizedFiles.join(', ')}`
          };
        }
        
        if (totalSize > MAX_TOTAL_SIZE) {
          return {
            success: false,
            message: `Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds the 20MB limit`
          };
        }
        
        // Add valid documents to form data
        validFiles.forEach(doc => {
          formData.append('documents', doc);
        });
        
        try {
          console.log(`MedicalRecordService: Uploading ${validFiles.length} files, total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
          
          const response = await API.post('/medical-records', formData, {
            headers: {
              ...commonHeaders,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000, // 60 seconds timeout for file uploads
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`MedicalRecordService: Upload progress: ${percentCompleted}%`);
            }
          });
          
          console.log('MedicalRecordService: Record created successfully with files');
          return {
            success: true,
            record: response.data.record || response.data
          };
        } catch (uploadError) {
          console.error('MedicalRecordService: Error uploading files:', uploadError);
          
          // Check if backend server is reachable
          const isConnected = await checkBackendConnection();
          if (!isConnected) {
            return {
              success: false,
              message: 'Cannot connect to the server. Please check your internet connection and try again.'
            };
          }
          
          // Specific error handling for file upload issues
          if (uploadError.message && uploadError.message.includes('Network Error')) {
            return {
              success: false,
              message: 'Network error during file upload. Please check your connection and try again.'
            };
          }
          
          if (uploadError.response?.status === 413) {
            return {
              success: false,
              message: 'Files too large. Please reduce file size or upload fewer files.'
            };
          }
          
          if (uploadError.response?.status === 415) {
            return {
              success: false,
              message: 'Unsupported file format. Please upload only supported document types.'
            };
          }
          
          if (uploadError.response?.status === 400) {
            return {
              success: false,
              message: uploadError.response.data?.message || 'Invalid request. Please check your inputs.'
            };
          }
          
          if (uploadError.response?.status === 401) {
            return {
              success: false,
              message: 'Your session has expired. Please login again.'
            };
          }
          
          // Generic error with as much detail as possible
          return {
            success: false,
            message: uploadError.response?.data?.message || 
                    'Error uploading files. Please try again or contact support if the issue persists.',
            error: uploadError.message
          };
        }
      } else {
        // No documents, just create the record
        try {
          const response = await API.post('/medical-records', recordData, {
            headers: commonHeaders,
            timeout: 15000 // 15 seconds timeout
          });
          
          console.log('MedicalRecordService: Record created successfully without files');
          return {
            success: true,
            record: response.data.record || response.data
          };
        } catch (createError) {
          console.error('MedicalRecordService: Error creating record:', createError);
          
          // Check connectivity
          const isConnected = await checkBackendConnection();
          if (!isConnected) {
            return {
              success: false,
              message: 'Cannot connect to the server. Please check your internet connection and try again.'
            };
          }
          
          // Handle specific error cases
          if (createError.response?.status === 401) {
            return {
              success: false,
              message: 'Your session has expired. Please login again.'
            };
          }
          
          return {
            success: false,
            message: createError.response?.data?.message || 
                    'Error creating medical record. Please try again or contact support if the issue persists.',
            error: createError.message
          };
        }
      }
    } catch (error) {
      console.error('MedicalRecordService: Unexpected error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
        error: error.message
      };
    }
  },

  // Update a medical record
  updateMedicalRecord: async (id, recordData, documents) => {
    try {
      // If documents are provided, use FormData to upload files
      if (documents && documents.length > 0) {
        const formData = new FormData();
        
        // Add record data to form data
        Object.keys(recordData).forEach(key => {
          formData.append(key, recordData[key]);
        });
        
        // Add documents to form data
        documents.forEach(doc => {
          formData.append('documents', doc);
        });
        
        const response = await API.put(`/medical-records/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Simple JSON request if no documents
        const response = await API.put(`/medical-records/${id}`, recordData);
        return response.data;
      }
    } catch (error) {
      console.error(`Error updating medical record ${id}:`, error);
      throw error;
    }
  },

  // Delete a medical record
  deleteMedicalRecord: async (id) => {
    try {
      const response = await API.delete(`/medical-records/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting medical record ${id}:`, error);
      throw error;
    }
  },

  // Download a document
  downloadDocument: async (recordId, documentId, filename) => {
    try {
      const response = await API.get(
        `/medical-records/${recordId}/documents/${documentId}/download`,
        { responseType: 'blob' }
      );
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error(`Error downloading document:`, error);
      throw error;
    }
  }
};

// Appointment Services
const AppointmentService = {
  getAllAppointments: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await API.get('/appointments', { 
        params: { page, limit, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },
  
  getAppointmentById: async (id) => {
    try {
      const response = await API.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      throw error;
    }
  },
  
  createAppointment: async (appointmentData) => {
    try {
      const response = await API.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },
  
  updateAppointment: async (id, appointmentData) => {
    try {
      const response = await API.put(`/appointments/${id}`, appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },
  
  refreshPatientInfo: async (appointmentId) => {
    console.log(`Refreshing patient info for appointment: ${appointmentId}`);
    return API.get(`/appointments/${appointmentId}/refresh-patient-info`);
  },
  
  cancelAppointment: async (id) => {
    try {
      const response = await API.patch(`/appointments/${id}/status`, { status: 'cancelled' });
      return response.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },
  
  getAvailableSlots: async (doctorId, date) => {
    try {
      const response = await API.get('/appointments/available-slots', { 
        params: { doctorId, date } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },
  
  getAppointmentsByDoctor: async (doctorId, params = {}) => {
    try {
      console.log(`Making API request to fetch appointments for doctor: ${doctorId}`);
      
      if (!doctorId) {
        console.error('getAppointmentsByDoctor: doctorId parameter is missing');
        throw new Error('Doctor ID is required');
      }
      
      // Ensure the doctorId is passed as a string
      const endpoint = `/appointments/doctor/${doctorId.toString()}`;
      console.log(`Calling endpoint: ${endpoint}`);
      
      const response = await API.get(endpoint, { params });
      
      console.log(`API response for doctor appointments:`, 
        Array.isArray(response.data) ? 
          `${response.data.length} appointments found` : 
          'Response is not an array');
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching doctor appointments for doctor ${doctorId}:`, error);
      
      // Provide more helpful error details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
        
        // If it's a 404, provide clear error about routing issues
        if (error.response.status === 404) {
          console.error(`Route not found. Make sure the endpoint /api/appointments/doctor/${doctorId} exists on your server`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
      
      // Check the server connectivity
      checkBackendConnection().then(connected => {
        console.log(`Backend server connection check: ${connected ? 'Connected' : 'Not connected'}`);
      });
      
      throw error;
    }
  },
  
  getAppointmentsByPatient: async (patientId, params = {}) => {
    try {
      const response = await API.get(`/appointments/patient/${patientId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw error;
    }
  }
};

// Dashboard/Analytics Services
const DashboardService = {
  getSummaryStats: async () => {
    return API.get('/dashboard/stats');
  },
  
  getRecentActivity: async () => {
    return API.get('/dashboard/activity');
  },
};

// Test MongoDB Connection
const testMongoDBConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    
    // Use the same BACKEND_URL that's configured for the app
    const healthUrl = `${BACKEND_URL}/api/health`;
    console.log('Using endpoint:', healthUrl);
    
    try {
      const response = await axios.get(healthUrl, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('MongoDB health response:', response.data);
      
      // Check if MongoDB is connected from the enhanced health endpoint
      if (response.data && response.data.mongodb && response.data.mongodb.connected) {
        return {
          success: true,
          data: {
            message: `Connected to MongoDB (${response.data.mongodb.database || 'unknown'} database)`,
            database: response.data.mongodb.database
          }
        };
      }
      
      return {
        success: false,
        error: {
          message: 'Database not connected according to health check',
          details: response.data?.mongodb || 'No connection details available'
        }
      };
    } catch (error) {
      console.error('MongoDB health check error:', error.message);
      
      // Try collections endpoint as a secondary check
      try {
        const collectionsUrl = `${BACKEND_URL}/api/db/collections`;
        const collectionsResponse = await axios.get(collectionsUrl, { timeout: 3000 });
        console.log('Collections check response:', collectionsResponse.data);
        
        return {
          success: true,
          data: {
            message: `Connected to ${collectionsResponse.data.database} database with ${collectionsResponse.data.collections.length} collections`
          }
        };
      } catch (collectionsError) {
        console.error('Collections check error:', collectionsError.message);
      }
      
      return {
        success: false,
        error: {
          message: 'Could not connect to MongoDB',
          details: error.message
        }
      };
    }
  } catch (error) {
    console.error('Unexpected error in MongoDB connection test:', error);
    return {
      success: false,
      error: {
        message: 'Could not test MongoDB connection',
        details: 'Unexpected error'
      }
    };
  }
};

const MedicalDocService = {
  getPendingDocs: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const response = await API.get('/medical-docs/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.docs || [];
    } catch (error) {
      console.error('Error fetching pending medical docs:', error);
      return [];
    }
  },
  getApprovedDocs: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const response = await API.get('/medical-docs/approved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.docs || [];
    } catch (error) {
      console.error('Error fetching approved medical docs:', error);
      return [];
    }
  },
  getRejectedDocs: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const response = await API.get('/medical-docs/rejected', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.docs || [];
    } catch (error) {
      console.error('Error fetching rejected medical docs:', error);
      return [];
    }
  },
  approveDoc: async (id, blockchainData = {}) => {
    try {
      const response = await API.patch(`/medical-docs/${id}/status`, {
        status: 'approved',
        blockchainTxHash: blockchainData.blockchainTxHash,
        blockchainTimestamp: blockchainData.blockchainTimestamp,
        approverWallet: blockchainData.approverWallet
      });
      return response.data.doc;
    } catch (error) {
      console.error('Error approving document:', error);
      throw error;
    }
  },
  rejectDoc: async (id) => {
    const token = localStorage.getItem('token');
    return API.patch(`/medical-docs/${id}/status`, { status: 'rejected' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getDoctorConfirmedDocs: async () => {
    const token = localStorage.getItem('token');
    const response = await API.get('/medical-docs/doctor/confirmed', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.docs || [];
  }
};

export {
  API,
  checkBackendConnection,
  PatientService,
  AuthService,
  MedicalRecordService,
  AppointmentService,
  DashboardService,
  testMongoDBConnection,
  MedicalDocService
};