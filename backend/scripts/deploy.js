require('dotenv').config();
const { deployContract } = require('../services/blockchain.service');

// Debug logging
console.log('Environment check before deployment:');
console.log('SEPOLIA_RPC_URL exists:', !!process.env.SEPOLIA_RPC_URL);
console.log('ADMIN_PRIVATE_KEY exists:', !!process.env.ADMIN_PRIVATE_KEY);

async function main() {
  try {
    console.log('\nStarting contract deployment...');
    const contractAddress = await deployContract();
    console.log('Contract deployed successfully!');
    console.log('Contract address:', contractAddress);
    
    // Save the contract address to a file or environment variable if needed
    // You can use this address later to interact with the contract
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 