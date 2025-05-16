require('dotenv').config();
const { getContractInstance, addRecord, getRecords } = require('../services/blockchain.service');

async function main() {
  try {
    console.log('Testing contract interaction...');
    
    // Get contract instance
    const contract = await getContractInstance();
    console.log('Successfully connected to contract at:', await contract.getAddress());
    
    // Get admin address
    const admin = await contract.admin();
    console.log('Contract admin address:', admin);
    
    // Test adding a record
    console.log('\nTesting addRecord function...');
    const testPatient = '0x1234567890123456789012345678901234567890'; // Example patient address
    const testIpfsHash = 'QmTest123'; // Example IPFS hash
    
    console.log('Adding record for patient:', testPatient);
    console.log('IPFS Hash:', testIpfsHash);
    
    const txHash = await addRecord(testPatient, testIpfsHash);
    console.log('Transaction hash:', txHash);
    
    // Test getting records
    console.log('\nTesting getRecords function...');
    const records = await getRecords(testPatient);
    console.log('Records for patient:', records);
    
  } catch (error) {
    console.error('Error during contract testing:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 