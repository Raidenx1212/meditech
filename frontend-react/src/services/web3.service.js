import Web3 from 'web3';

class Web3Service {
  constructor() {
    this.web3 = null;
    this.provider = null;
    this.isInitialized = false;
    this.connectedAddress = null;
    this.isDisconnected = false;
    this.initializationPromise = null;
    this.lastInitTime = 0;
  }

  // Added new method to completely reset connection state
  resetConnection() {
    console.log('Web3Service: Resetting connection state');
    this.web3 = null;
    this.provider = null;
    this.isInitialized = false;
    this.connectedAddress = null;
    this.isDisconnected = true;
    this.initializationPromise = null;
    
    // Mark as disconnected in localStorage to prevent auto-reconnection
    try {
      localStorage.setItem('isDisconnected', 'true');
      localStorage.removeItem('walletAddress');
    } catch (err) {
      console.warn('Failed to update localStorage during reset:', err);
    }
    
    return true;
  }

  async initialize() {
    // Always check if manual disconnection is required
    if (window.location.pathname === '/login') {
      console.log('Web3Service: On login page, enforcing disconnected state');
      this.resetConnection();
      return Promise.resolve(false);
    }
    
    // Prevent too frequent initialization attempts
    const now = Date.now();
    if (now - this.lastInitTime < 1000) {
      return this.initializationPromise || Promise.resolve(false);
    }
    this.lastInitTime = now;

    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Create a new initialization promise
    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  async _initialize() {
    try {
      // Check persistent disconnection flag
      if (localStorage.getItem('isDisconnected') === 'true') {
        console.log('Web3Service: Previously disconnected. Not auto-reconnecting.');
        this.isDisconnected = true;
        this.initializationPromise = null;
        return false;
      }

      // Check if already initialized and connected
      if (this.isInitialized && this.web3 && this.provider) {
        try {
          if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              this.connectedAddress = accounts[0];
              // Don't auto-save wallet address to prevent auto-login
              console.log('Web3Service: Already initialized with address', this.connectedAddress);
              this.initializationPromise = null;
              return true;
            }
          }
        } catch (err) {
          console.warn('Failed to verify current connection', err);
        }
      }

      if (!window.ethereum) {
        console.error('MetaMask is not installed: window.ethereum is undefined');
        this.initializationPromise = null;
        throw new Error('MetaMask is not installed or not accessible');
      }

      this.provider = window.ethereum;
      console.log('Web3Service: Provider detected', this.provider);

      // Create Web3 instance
      this.web3 = new Web3(this.provider);
      this.isInitialized = true;
      
      // Reset disconnection flag
      this.isDisconnected = false;

      try {
        const accounts = await this.provider.request({ method: 'eth_accounts' });
        console.log('Web3Service: Current accounts', accounts);
        if (accounts && accounts.length > 0) {
          this.connectedAddress = accounts[0];
          // Just store address internally but don't trigger auto-login actions
          console.log('Web3Service: Connected address', this.connectedAddress);
        }
        // Remove auto-reconnection logic - no longer auto-reconnect based on saved address
      } catch (err) {
        console.warn('Failed to get initial accounts', err);
      }

      // Set up event handlers
      this.provider.on('chainChanged', (chainId) => {
        console.log('Web3Service: Chain changed to', chainId);
        try {
          localStorage.setItem('lastChainId', chainId);
        } catch (err) {
          console.warn('Failed to save chain ID', err);
        }
        window.location.reload();
      });

      this.provider.on('accountsChanged', (accounts) => {
        console.log('Web3Service: Accounts changed', accounts);
        if (!accounts || accounts.length === 0) {
          this.connectedAddress = null;
          this.isDisconnected = true;
          try {
            localStorage.removeItem('walletAddress');
          } catch (err) {
            console.warn('Failed to remove wallet address', err);
          }
        } else {
          this.connectedAddress = accounts[0];
          console.log('Web3Service: Updated connected address', this.connectedAddress);
        }
      });

      this.initializationPromise = null;
      return true;
    } catch (error) {
      console.error('Web3 initialization error:', error);
      this.isInitialized = false;
      this.web3 = null;
      this.provider = null;
      this.connectedAddress = null;
      this.initializationPromise = null;
      throw error;
    }
  }

  async connectWallet() {
    try {
      console.log('Web3Service: Connecting wallet...');
      localStorage.removeItem('isDisconnected');
      this.isDisconnected = false;

      if (!this.isInitialized) {
        console.log('Web3Service: Not initialized, initializing...');
        await this.initialize();
      }

      if (!this.provider || !this.web3) {
        console.error('Web3Service: Provider or web3 not available after initialization');
        throw new Error('MetaMask is not available. Please refresh the page and try again.');
      }

      console.log('Web3Service: Requesting accounts...');
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      console.log('Web3Service: Received accounts', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please check your MetaMask configuration.');
      }

      const address = accounts[0].toLowerCase(); // Convert to lowercase for consistency
      console.log('Web3Service: Setting connected address to', address);
      this.connectedAddress = address;

      // Store the wallet address in localStorage
      try {
        localStorage.setItem('walletAddress', address);
        console.log('Web3Service: Saved wallet address to localStorage:', address);
        
        // Also update the user object if it exists
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.walletAddress = address;
          localStorage.setItem('user', JSON.stringify(user));
          console.log('Web3Service: Updated user object with wallet address');
        }
      } catch (err) {
        console.warn('Failed to save wallet address to localStorage', err);
      }

      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        throw new Error('You rejected the connection request. Please approve the MetaMask connection to continue.');
      } else if (error.code === -32002) {
        throw new Error('A MetaMask connection request is already pending. Please open MetaMask and confirm the connection.');
      } else {
        throw error;
      }
    }
  }

  // Get current connection status
  isConnected() {
    return !!this.connectedAddress;
  }

  // Get current address
  getCurrentAddress() {
    if (this.isDisconnected) {
      return null;
    }
    return this.connectedAddress;
  }

  // Simplified verification that doesn't throw errors
  async verifyWalletConnection(expectedAddress) {
    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to initialize Web3 during verification:', error);
        return false;
      }
    }

    try {
      // If no expected address is provided, just check if any wallet is connected
      if (!expectedAddress) {
        return !!this.connectedAddress;
      }

      if (!this.connectedAddress) {
        return false;
      }

      // Trim both addresses to remove any extra whitespace
      const currentAddressLower = this.connectedAddress.trim().toLowerCase();
      const expectedAddressLower = expectedAddress.trim().toLowerCase();

      return currentAddressLower === expectedAddressLower;
    } catch (error) {
      console.error('Error verifying wallet connection:', error);
      return false;
    }
  }

  async signMessage(message, address) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // First try the legacy personal sign method which has better support
      try {
        const signature = await this.web3.eth.personal.sign(
          message,
          address,
          '' // Password parameter is not used with MetaMask
        );
        return signature;
      } catch (personalSignError) {
        console.warn('Personal sign failed, trying typed data sign:', personalSignError);
        
        // Fall back to typed data sign if personal sign fails
        const msgParams = JSON.stringify({
          domain: {
            name: 'MediTech Healthcare DMS',
            version: '1',
            chainId: await this.web3.eth.getChainId(),
          },
          message: {
            contents: message,
            wallet: address,
            timestamp: new Date().toISOString()
          },
          primaryType: 'Authentication',
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
            ],
            Authentication: [
              { name: 'contents', type: 'string' },
              { name: 'wallet', type: 'address' },
              { name: 'timestamp', type: 'string' }
            ],
          },
        });

        const signature = await this.provider.request({
          method: 'eth_signTypedData_v4',
          params: [address, msgParams],
        });

        return signature;
      }
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  // Helper method to safely get contract instance
  async getContract(contractAddress, contractABI) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!contractAddress || !contractABI) {
      throw new Error('Contract address and ABI must be provided');
    }

    try {
      return new this.web3.eth.Contract(contractABI, contractAddress);
    } catch (error) {
      console.error('Error creating contract instance:', error);
      throw new Error('Failed to initialize contract. Please check your connection and try again.');
    }
  }

  // Method to interact with smart contract for PDF approval
  async approvePdfChange(contractAddress, contractABI, pdfHash, userAddress) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const contract = await this.getContract(contractAddress, contractABI);
      if (!userAddress) {
        const accounts = await this.web3.eth.getAccounts();
        if (accounts.length === 0) {
          throw new Error('No wallet connected. Please connect your wallet first.');
        }
        userAddress = accounts[0];
      }
      
      // Verify gas estimate first
      let gasEstimate;
      try {
        gasEstimate = await contract.methods.approvePdfChange(pdfHash)
          .estimateGas({ from: userAddress });
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error('Transaction would fail: ' + (gasError.message || 'Unknown error in gas estimation'));
      }

      const result = await contract.methods.approvePdfChange(pdfHash)
        .send({
          from: userAddress,
          gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer to gas estimate
        });

      return result;
    } catch (error) {
      console.error('Error approving PDF change:', error);
      
      // Better error handling for common blockchain errors
      if (error.code === 4001) {
        throw new Error('Transaction rejected. You declined the transaction in MetaMask.');
      } else if (error.message && error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction. Please check your wallet balance.');
      } else {
        throw error;
      }
    }
  }

  // Disconnect wallet: clear address, localStorage, and reset state
  async disconnectWallet() {
    try {
      console.log('Web3Service: Disconnecting wallet...');
      this.connectedAddress = null;
      try {
        localStorage.removeItem('walletAddress');
      } catch (err) {
        console.warn('Failed to remove wallet address from localStorage', err);
      }
      if (this.provider) {
        try {
          this.provider.removeAllListeners('accountsChanged');
          this.provider.removeAllListeners('chainChanged');
          this.provider.removeAllListeners('disconnect');
          await this.provider.request({ method: 'eth_accounts' });
        } catch (err) {
          console.warn('Error during provider cleanup:', err);
        }
      }
      this.isInitialized = false;
      this.web3 = null;
      this.provider = null;
      this.isDisconnected = true;
      localStorage.setItem('isDisconnected', 'true');
      console.log('Web3Service: Wallet disconnected successfully');
      return true;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw new Error('Failed to disconnect wallet. Please try again.');
    }
  }
}

// Create a singleton instance
const web3Service = new Web3Service();

export default web3Service; 