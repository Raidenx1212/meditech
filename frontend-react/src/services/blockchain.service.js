import { ethers } from 'ethers';
import Web3Service from './web3.service';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Fetch contract info from backend
      const response = await fetch('/api/blockchain/contract-info');
      const { address, abi } = await response.json();
      
      if (!address || !abi) {
        throw new Error('Contract information not available');
      }

      // Use Web3Service for MetaMask provider
      await Web3Service.initialize();
      if (window.ethereum) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.contract = new ethers.Contract(address, abi, this.provider);
        this.isInitialized = true;
      } else {
        throw new Error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      throw error;
    }
  }

  async connectWallet() {
    try {
      await this.initialize();
      const address = await Web3Service.connectWallet();
      if (address && window.ethereum) {
        this.signer = this.provider.getSigner();
        this.contract = this.contract.connect(this.signer);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error connecting wallet in BlockchainService:', error);
      throw error;
    }
  }

  async ensureWalletConnected() {
    if (!this.isInitialized || !this.signer) {
      return await this.connectWallet();
    }
    return true;
  }

  async registerPatient(patientId) {
    try {
      await this.ensureWalletConnected();
      const tx = await this.contract.registerPatient(patientId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error registering patient:', error);
      throw error;
    }
  }

  async authorizeDoctor(patientId, doctorAddress) {
    try {
      await this.ensureWalletConnected();
      const tx = await this.contract.authorizeDoctor(patientId, doctorAddress);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error authorizing doctor:', error);
      throw error;
    }
  }

  async addPatientRecord(patientId, recordData) {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    
    try {
      const connected = await this.ensureWalletConnected();
      if (!connected) {
        throw new Error('Wallet is not connected. Please connect your MetaMask wallet.');
      }
      
      if (!recordData || !recordData.ipfsHash) {
        throw new Error('Invalid record data: IPFS hash is required');
      }
      
      // Extract or default each field
      const ipfsHash = recordData.ipfsHash;
      const recordType = recordData.type || 'General';
      const diagnosis = recordData.diagnosis || '';
      const notes = recordData.notes || '';
      
      console.log(`Adding patient record to blockchain for patient ${patientId}`);
      console.log('Record data:', { ipfsHash, recordType, diagnosis: diagnosis.substring(0, 20) + '...' });
      
      try {
        const tx = await this.contract.addPatientRecord(
          patientId,
          ipfsHash,
          recordType,
          diagnosis,
          notes
        );
        
        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        return tx.hash;
      } catch (txError) {
        console.error('Transaction error:', txError);
        
        // Handle specific error cases
        if (txError.code === 'INSUFFICIENT_FUNDS') {
          throw new Error('Insufficient funds to complete the transaction. Please add more ETH to your wallet.');
        } else if (txError.code === 'UNPREDICTABLE_GAS_LIMIT') {
          throw new Error('Cannot estimate gas for transaction. The contract may have reverted the transaction.');
        } else if (txError.message && txError.message.includes('user rejected')) {
          throw new Error('Transaction was rejected. Please confirm the transaction in MetaMask.');
        }
        
        throw txError;
      }
    } catch (error) {
      console.error('Error adding patient record:', error);
      throw error;
    }
  }

  async updatePatientRecord(patientId, recordId, recordData) {
    try {
      await this.ensureWalletConnected();
      const tx = await this.contract.updatePatientRecord(
        patientId,
        recordId,
        recordData.ipfsHash,
        recordData.diagnosis,
        recordData.notes
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error updating patient record:', error);
      throw error;
    }
  }

  async getPatientRecord(patientId, recordId) {
    try {
      const record = await this.contract.getPatientRecord(patientId, recordId);
      return {
        ipfsHash: record[0],
        createdBy: record[1],
        timestamp: record[2],
        isValid: record[3],
        type: record[4],
        diagnosis: record[5],
        notes: record[6]
      };
    } catch (error) {
      console.error('Error getting patient record:', error);
      throw error;
    }
  }

  async verifyRecord(patientId, recordId) {
    try {
      await this.ensureWalletConnected();
      return await this.contract.verifyRecord(patientId, recordId);
    } catch (error) {
      console.error('Error verifying record:', error);
      throw error;
    }
  }

  async getRecordCount(patientId) {
    try {
      return await this.contract.getRecordCount(patientId);
    } catch (error) {
      console.error('Error getting record count:', error);
      throw error;
    }
  }

  async getAuthorizedDoctors(patientId) {
    try {
      return await this.contract.getAuthorizedDoctors(patientId);
    } catch (error) {
      console.error('Error getting authorized doctors:', error);
      throw error;
    }
  }

  async isDoctorAuthorized(patientId, doctorAddress) {
    try {
      return await this.contract.isDoctorAuthorized(patientId, doctorAddress);
    } catch (error) {
      console.error('Error checking doctor authorization:', error);
      throw error;
    }
  }

  async getPatientRecords(patientAddress) {
    const records = await this.contract.getRecords(patientAddress);
    // records is an array of { ipfsHash, timestamp }
    return records.map(r => ({
      ipfsHash: r.ipfsHash,
      timestamp: r.timestamp.toNumber ? r.timestamp.toNumber() : Number(r.timestamp)
    }));
  }

  async approveDocument(documentId, patientId, doctorId) {
    try {
      await this.connectWallet(); // This will trigger MetaMask popup
      
      if (!this.signer) {
        throw new Error('Please connect your MetaMask wallet first');
      }

      // Get the connected wallet address
      const connectedAddress = await this.signer.getAddress();
      
      // Get the user's stored wallet address from localStorage
      const userWalletAddress = localStorage.getItem('walletAddress');
      
      console.log('Connected wallet:', connectedAddress);
      console.log('User wallet:', userWalletAddress);

      // Convert both addresses to lowercase for comparison
      if (userWalletAddress && 
          connectedAddress.toLowerCase() !== userWalletAddress.toLowerCase()) {
        throw new Error('Please connect with the wallet address associated with your account');
      }

      // Connect contract with signer
      this.contract = this.contract.connect(this.signer);

      console.log('Calling approveDocument with params:', {
        documentId
      });

      // Call the smart contract function
      const tx = await this.contract.approveDocument(documentId);

      // Wait for transaction to be mined
      console.log('Waiting for transaction to be mined...');
      const receipt = await tx.wait();
      console.log('Transaction mined:', receipt);

      return {
        transactionHash: receipt.transactionHash,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error approving document on blockchain:', error);
      
      // Handle specific error cases
      if (error.code === 4001) {
        throw new Error('You rejected the transaction. Please try again and confirm in MetaMask.');
      } else if (error.code === -32603) {
        if (error.message.includes('execution reverted')) {
          throw new Error('Transaction failed: Only the patient can approve documents.');
        }
      }
      
      throw error;
    }
  }
}

export default new BlockchainService(); 