import { io } from 'socket.io-client';
import { AuthService } from './api.service';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = this.maxReconnectAttempts || 5;
  }

  // Initialize and connect to the socket server
  init() {
    if (this.socket) {
      console.log('Socket already initialized');
      return this.socket;
    }

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    try {
      // Get auth token for authenticated connections
      const token = localStorage.getItem('token');
      const options = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      };

      // If token exists, add it to the auth
      if (token && AuthService.isAuthenticated()) {
        options.auth = { token: token };
      }

      this.socket = io(BACKEND_URL, options);
      this.setupEventListeners();
      
      return this.socket;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      return null;
    }
  }

  // Set up default socket event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached, giving up');
        this.socket.disconnect();
      }
    });

    // Listen for appointment updates
    this.socket.on('appointment_update', (data) => {
      console.log('Appointment update received:', data);
      // Dispatch to any listeners
      this.dispatchEvent('appointment_update', data);
    });

    // Listen for new appointments
    this.socket.on('new_appointment', (data) => {
      console.log('New appointment received:', data);
      this.dispatchEvent('new_appointment', data);
    });

    // Listen for appointment cancellations
    this.socket.on('appointment_cancelled', (data) => {
      console.log('Appointment cancellation received:', data);
      this.dispatchEvent('appointment_cancelled', data);
    });
  }

  // Subscribe to specific appointment updates for a doctor or patient
  subscribeToAppointments(userId, userType) {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected, cannot subscribe');
      return false;
    }

    this.socket.emit('subscribe_appointments', { userId, userType });
    return true;
  }

  // Add an event listener for a specific event
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
    return () => this.removeEventListener(event, callback);
  }

  // Remove an event listener
  removeEventListener(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  // Dispatch an event to all listeners
  dispatchEvent(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Disconnect the socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Create and export a singleton instance
const socketService = new SocketService();
export default socketService; 