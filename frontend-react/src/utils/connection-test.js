import axios from 'axios';

// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

/**
 * Tests the backend connection
 * @returns {Promise<Object>} Test result object
 */
export const testBackendConnection = async () => {
  console.log('Testing backend connection...');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Backend connection status:', response.status);
    console.log('Backend response:', response.data);
    return {
      success: true,
      message: 'Backend connection successful',
      data: response.data
    };
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    return {
      success: false,
      message: `Backend connection failed: ${error.message}`,
      error
    };
  }
};

/**
 * Tests patient creation
 * @returns {Promise<Object>} Test result object
 */
export const testPatientCreation = async () => {
  console.log('Testing patient creation...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    return {
      success: false,
      message: 'No authentication token found. Please login first.'
    };
  }
  
  const testPatient = {
    firstName: 'Test',
    lastName: 'Patient',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    email: `test${Date.now()}@example.com`,
    contactNumber: '555-1234',
    address: '123 Test St',
    bloodType: 'A+',
    allergies: ['None'],
    emergencyContact: {
      name: 'Emergency Contact',
      relationship: 'Family',
      phone: '555-5678'
    },
    status: 'active',
    registrationDate: new Date().toISOString().split('T')[0]
  };
  
  try {
    const response = await axios.post(`${API_URL}/patients`, testPatient, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Patient creation successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return {
      success: true,
      message: 'Patient creation successful',
      data: response.data
    };
  } catch (error) {
    console.error('Patient creation failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return {
      success: false,
      message: `Patient creation failed: ${error.message}`,
      error,
      response: error.response
    };
  }
};

/**
 * Tests MongoDB connection
 * @returns {Promise<Object>} Test result object
 */
export const testMongoDBConnection = async () => {
  console.log('Testing MongoDB connection...');
  try {
    const response = await axios.get(`${API_URL}/db/status`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('MongoDB connection status:', response.data);
    return {
      success: true,
      message: 'MongoDB connection successful',
      data: response.data
    };
  } catch (error) {
    console.error('MongoDB connection test failed:', error.message);
    return {
      success: false,
      message: `MongoDB connection test failed: ${error.message}`,
      error
    };
  }
};

/**
 * Run all connection tests and return results
 * @returns {Promise<Object>} Results of all tests
 */
export const runAllTests = async () => {
  const results = {
    backend: await testBackendConnection(),
    mongodb: null,
    patient: null
  };
  
  if (results.backend.success) {
    results.mongodb = await testMongoDBConnection();
    
    if (results.mongodb.success) {
      results.patient = await testPatientCreation();
    }
  }
  
  return results;
};

export default {
  testBackendConnection,
  testPatientCreation,
  testMongoDBConnection,
  runAllTests
}; 