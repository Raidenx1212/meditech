const express = require('express');
const router = express.Router();
const { deployContract, addRecord, getRecords, getDocumentApprovals, getContractABI, getDeployedContractAddress } = require('../services/blockchain.service');
const { ethers } = require('ethers'); // For address validation
const { protect } = require('../middleware/auth.middleware');
const blockchainService = require('../services/blockchain.service');

// Endpoint to deploy the smart contract
router.post('/deploy', async (req, res) => {
  try {
    const contractAddress = await deployContract();
    res.json({ success: true, contractAddress, message: 'Contract deployed successfully.' });
  } catch (err) {
    console.error('Error in /deploy route:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Endpoint to add a record (IPFS hash) for a patient
router.post('/add-record', async (req, res) => {
  const { patientAddress, ipfsHash } = req.body;

  if (!patientAddress || !ipfsHash) {
    return res.status(400).json({ success: false, message: 'Patient address and IPFS hash are required.' });
  }
  if (!ethers.utils.isAddress(patientAddress)) {
    return res.status(400).json({ success: false, message: 'Invalid patient address format.' });
  }

  try {
    const txHash = await addRecord(patientAddress, ipfsHash);
    res.json({ success: true, txHash, message: 'Record added successfully.' });
  } catch (err) {
    console.error('Error in /add-record route:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Endpoint to get all records for a patient
router.get('/records/:patientAddress', async (req, res) => {
  const { patientAddress } = req.params;

  if (!ethers.utils.isAddress(patientAddress)) {
    return res.status(400).json({ success: false, message: 'Invalid patient address format.' });
  }

  try {
    const records = await getRecords(patientAddress);
    res.json({ success: true, records });
  } catch (err) {
    console.error(`Error in /records/:patientAddress route for ${patientAddress}:`, err);
    if (err.message.includes('Contract not deployed')) {
        return res.status(404).json({ success: false, message: 'Contract not found. Please deploy the contract first.'});
    }
    // Handle contract revert reasons (like Unauthorized access)
    if (err.reason) {
        return res.status(403).json({ success: false, message: `Contract error: ${err.reason}` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get contract information (address and ABI)
router.get('/contract-info', async (req, res) => {
    try {
        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) {
            return res.status(500).json({
                success: false,
                message: 'Contract address not configured'
            });
        }

        // Get contract ABI from the artifact
        const contractArtifact = require('../artifacts/contracts/MedicalRecords.sol/MedicalRecords.json');
        
        res.json({
            success: true,
            address: contractAddress,
            abi: contractArtifact.abi
        });
    } catch (error) {
        console.error('Error getting contract info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get contract information'
        });
    }
});

// Get contract status
router.get('/contract-status', async (req, res) => {
    try {
        const contract = await blockchainService.getContractInstance();
        const address = await contract.getAddress();
        
        res.json({
            success: true,
            address: address,
            isDeployed: true
        });
    } catch (error) {
        console.error('Error getting contract status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get contract status'
        });
    }
});

// Get document approvals for a patient
router.get('/approvals/:patientAddress', async (req, res) => {
  const { patientAddress } = req.params;

  if (!ethers.utils.isAddress(patientAddress)) {
    return res.status(400).json({ success: false, message: 'Invalid patient address format.' });
  }

  try {
    const approvals = await getDocumentApprovals(patientAddress);
    res.json({ success: true, approvals });
  } catch (err) {
    console.error(`Error in /approvals/:patientAddress route for ${patientAddress}:`, err);
    if (err.message.includes('Contract not deployed')) {
      return res.status(404).json({ success: false, message: 'Contract not found. Please deploy the contract first.'});
    }
    if (err.reason) {
      return res.status(403).json({ success: false, message: `Contract error: ${err.reason}` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 