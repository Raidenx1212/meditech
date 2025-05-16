import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Typography, Box, Alert, CircularProgress, Tooltip } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Web3Service from '../../services/web3.service';
import { maskEmail } from '../../utils/formatUtils';
import detectEthereumProvider from '@metamask/detect-provider';

const MetaMaskAuth = ({ onConnect, onDisconnect, requiredAddress }) => {
  const [status, setStatus] = useState('idle'); // idle, checking, connecting, verifying, connected, error
  const [error, setError] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(null);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  
  // Use refs to prevent unnecessary re-renders
  const lastCheckTimeRef = useRef(0);
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);
  const initialCheckDoneRef = useRef(false);

  // Effect for component mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial connection check, but only once
    if (!initialCheckDoneRef.current) {
      initialCheckDoneRef.current = true;
      safelyCheckConnection();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const connectWallet = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setStatus('connecting');
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('Please install MetaMask!');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      if (account && mountedRef.current) {
        setConnectedAddress(account);
        setStatus('connected');
        if (onConnect) {
          onConnect(account);
        }
      }
    } catch (error) {
      if (mountedRef.current) {
      console.error('Error connecting to MetaMask:', error);
      setError(error.message || 'Failed to connect to MetaMask');
      setStatus('error');
      }
    }
  }, [onConnect]);

  const handleDisconnect = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setStatus('disconnecting');
      setConnectedAddress(null);
      setError('');
      setConnectionAttempted(false);
      
      if (onDisconnect) {
        onDisconnect();
      }
      
      await Web3Service.disconnectWallet();
      
      if (mountedRef.current) {
        setStatus('idle');
      }
      
      // Use a timeout to prevent flickering
      setTimeout(() => {
      window.location.reload();
      }, 300);
    } catch (error) {
      if (mountedRef.current) {
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet. Please try again.');
      setStatus('error');
      }
    }
  }, [onDisconnect]);

  // Function to safely check connection without triggering re-renders
  const safelyCheckConnection = useCallback(async () => {
    if (!mountedRef.current || isCheckingRef.current) return;
    
      const now = Date.now();
    if (now - lastCheckTimeRef.current < 1000) return;
    
    lastCheckTimeRef.current = now;
    isCheckingRef.current = true;
    
    try {
      if (connectionAttempted && (status === 'connected' || status === 'idle' || status === 'error')) {
        isCheckingRef.current = false;
        return;
      }
      
      if (mountedRef.current) {
      setStatus('checking');
      }
      
      if (!window.ethereum) {
        if (mountedRef.current) {
        setIsMetaMaskInstalled(false);
        setStatus('error');
        setError('MetaMask is not installed or not accessible');
        setConnectionAttempted(true);
        }
        isCheckingRef.current = false;
        return;
      }
      
      if (mountedRef.current) {
      setIsMetaMaskInstalled(true);
      }
      
      await Web3Service.initialize();
      
      const currentAddress = Web3Service.getCurrentAddress();
      if (currentAddress && mountedRef.current) {
        setConnectedAddress(currentAddress);
        setStatus('connected');
        setConnectionAttempted(true);
        
        // Only notify about the connection, but don't trigger auto-login
        if (onConnect) {
          // Just update the UI with wallet information without auto-login
          onConnect(currentAddress);
        }
      } else if (mountedRef.current) {
        setStatus('idle');
        setConnectionAttempted(true);
      }
    } catch (err) {
      if (mountedRef.current) {
      console.error('Error checking MetaMask:', err);
      setStatus('error');
      setError(err.message || 'Failed to connect to MetaMask');
      setConnectionAttempted(true);
    }
    } finally {
      isCheckingRef.current = false;
      }
  }, [connectionAttempted, onConnect, status]);

  // Memoize the status content to prevent unnecessary re-renders
  const statusContent = useMemo(() => {
    switch (status) {
      case 'checking':
      case 'connecting':
      case 'disconnecting':
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CircularProgress size={20} color="inherit" />}
            disabled
            fullWidth
          >
            {status === 'disconnecting' ? 'Disconnecting...' : 'Connecting to MetaMask...'}
          </Button>
        );
      case 'verifying':
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CircularProgress size={20} color="inherit" />}
            disabled
            fullWidth
          >
            Verifying Wallet...
          </Button>
        );
      case 'error':
        return (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={connectWallet}
              fullWidth
            >
              Retry Connection
            </Button>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        );
      case 'connected':
        return (
          <Box>
            <Alert 
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success" 
              sx={{ mb: 2 }}
            >
              Wallet Connected and Verified
            </Alert>
            <Tooltip title={connectedAddress || ''}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                {connectedAddress ? `${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}` : ''}
              </Typography>
            </Tooltip>
            <Button
              variant="outlined"
              color="error"
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </Button>
          </Box>
        );
      case 'idle':
      default:
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AccountBalanceWalletIcon />}
            onClick={connectWallet}
            fullWidth
          >
            Connect MetaMask
          </Button>
        );
    }
  }, [status, error, connectedAddress, connectWallet, handleDisconnect]);

  if (isMetaMaskInstalled === null) {
    return (
      <Box sx={{ textAlign: 'center', p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (isMetaMaskInstalled === false) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h6" gutterBottom>
          MetaMask is not installed
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href="https://metamask.io/download.html"
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
        >
          Install MetaMask
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      {statusContent}
    </Box>
  );
};

export default React.memo(MetaMaskAuth); 