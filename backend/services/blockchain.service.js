require('dotenv').config();
const { ethers } = require('ethers');

// Check if blockchain features are enabled
const isBlockchainEnabled = process.env.ADMIN_PRIVATE_KEY && process.env.SEPOLIA_RPC_URL;

if (!isBlockchainEnabled) {
  console.log('Blockchain features are disabled. Set ADMIN_PRIVATE_KEY and SEPOLIA_RPC_URL to enable.');
  console.log('ADMIN_PRIVATE_KEY exists:', !!process.env.ADMIN_PRIVATE_KEY);
  console.log('SEPOLIA_RPC_URL exists:', !!process.env.SEPOLIA_RPC_URL);
}

let contractArtifact;
let provider;
let adminWallet;
let contractInstance;
let contractAddress;

// Only load blockchain dependencies if enabled
if (isBlockchainEnabled) {
  try {
    contractArtifact = require('../artifacts/contracts/MedicalRecords.sol/MedicalRecords.json');
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    adminWallet = new ethers.Wallet(formatPrivateKey(process.env.ADMIN_PRIVATE_KEY), provider);
  } catch (error) {
    console.error('Error initializing blockchain service:', error.message);
    console.log('Blockchain features will be disabled.');
  }
}

// Helper function to ensure private key is properly formatted
function formatPrivateKey(key) {
  if (!key) throw new Error('Private key is required');
  console.log('Private key length:', key.length);
  // Remove '0x' prefix if present
  key = key.replace('0x', '');
  // Add '0x' prefix
  return `0x${key}`;
}

async function deployContract() {
  if (!isBlockchainEnabled) {
    throw new Error('Blockchain features are disabled. Set ADMIN_PRIVATE_KEY and SEPOLIA_RPC_URL to enable.');
  }
  
  console.log('Deploying contract...');
  try {
    // Log the bytecode to verify it's correct
    console.log('Contract bytecode length:', contractArtifact.bytecode.length);
    console.log('Contract ABI length:', contractArtifact.abi.length);

    // Create contract factory with explicit types
    const contractFactory = new ethers.ContractFactory(
      contractArtifact.abi,
      contractArtifact.bytecode,
      adminWallet
    );

    // Deploy the contract and wait for it to be mined
    console.log('Initiating contract deployment...');
    const deployedContract = await contractFactory.deploy();
    console.log('Deployment transaction hash:', deployedContract.deploymentTransaction().hash);
    
    // Wait for the deployment transaction to be mined
    console.log('Waiting for deployment to be mined...');
    await deployedContract.waitForDeployment();
    
    // Get the contract address
    contractAddress = await deployedContract.getAddress();
    contractInstance = deployedContract;
    
    console.log('Contract deployed successfully at address:', contractAddress);
    return contractAddress;
  } catch (error) {
    console.error('Error deploying contract:');
    console.error('Error message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.transaction) {
      console.error('Transaction details:', error.transaction);
    }
    if (error.receipt) {
      console.error('Transaction receipt:', error.receipt);
    }
    throw error;
  }
}

async function getContractInstance() {
  if (!isBlockchainEnabled) {
    throw new Error('Blockchain features are disabled. Set ADMIN_PRIVATE_KEY and SEPOLIA_RPC_URL to enable.');
  }
  
  if (contractInstance) return contractInstance;
  if (process.env.CONTRACT_ADDRESS) {
    contractAddress = process.env.CONTRACT_ADDRESS;
    console.log('Using contract from .env address:', contractAddress);
    contractInstance = new ethers.Contract(contractAddress, contractArtifact.abi, adminWallet);
    return contractInstance;
  } else if (contractAddress) {
    console.log('Using contract deployed in this session:', contractAddress);
    contractInstance = new ethers.Contract(contractAddress, contractArtifact.abi, adminWallet);
    return contractInstance;
  }
  throw new Error('Contract not deployed and CONTRACT_ADDRESS not set in .env');
}

async function addRecord(patientAddress, ipfsHash) {
  if (!isBlockchainEnabled) {
    console.log('Blockchain features disabled - skipping record addition to blockchain');
    return 'blockchain_disabled';
  }
  
  const contract = await getContractInstance();
  const tx = await contract.connect(adminWallet).addRecord(patientAddress, ipfsHash);
  await tx.wait();
  console.log(`Record added for patient ${patientAddress} with IPFS hash ${ipfsHash}. Tx hash: ${tx.hash}`);
  return tx.hash;
}

async function getRecords(patientAddress) {
  if (!isBlockchainEnabled) {
    console.log('Blockchain features disabled - returning empty records');
    return [];
  }
  
  const contract = await getContractInstance();
  console.log(`Fetching records for patient ${patientAddress} by admin/backend.`);
  const recordsRaw = await contract.connect(adminWallet).getRecords(patientAddress);
  return recordsRaw.map(record => ({
    ipfsHash: record.ipfsHash,
    timestamp: record.timestamp.toNumber ? record.timestamp.toNumber() : Number(record.timestamp)
  }));
}

// New functions for document approval

async function getDocumentApprovals(patientAddress) {
  if (!isBlockchainEnabled) {
    console.log('Blockchain features disabled - returning empty approvals');
    return [];
  }
  
  const contract = await getContractInstance();
  console.log(`Fetching document approvals for patient ${patientAddress}`);
  const approvalsRaw = await contract.connect(adminWallet).getDocumentApprovals(patientAddress);
  return approvalsRaw.map(approval => ({
    ipfsHash: approval.ipfsHash,
    patient: approval.patient,
    approved: approval.approved,
    timestamp: approval.timestamp.toNumber ? approval.timestamp.toNumber() : Number(approval.timestamp)
  }));
}

async function approveDocument(documentId) {
  if (!isBlockchainEnabled) {
    console.log('Blockchain features disabled - skipping document approval');
    return 'blockchain_disabled';
  }
  
  const contract = await getContractInstance();
  console.log(`Approving document ${documentId} using admin wallet`);
  const tx = await contract.connect(adminWallet).approveDocument(documentId);
  await tx.wait();
  console.log(`Document ${documentId} approved. Tx hash: ${tx.hash}`);
  return tx.hash;
}

// This function returns the contract ABI for frontend use
function getContractABI() {
  if (!isBlockchainEnabled) {
    return [];
  }
  return contractArtifact.abi;
}

// This function returns the contract address for frontend use
function getDeployedContractAddress() {
  if (!isBlockchainEnabled) {
    return null;
  }
  
  if (!contractAddress && process.env.CONTRACT_ADDRESS) {
    contractAddress = process.env.CONTRACT_ADDRESS;
  }
  if (!contractAddress) {
    throw new Error('Contract not deployed and CONTRACT_ADDRESS not set in .env');
  }
  return contractAddress;
}

module.exports = { 
  deployContract, 
  addRecord, 
  getRecords, 
  getContractInstance,
  getDocumentApprovals,
  getContractABI,
  getDeployedContractAddress,
  approveDocument,
  isBlockchainEnabled
}; 