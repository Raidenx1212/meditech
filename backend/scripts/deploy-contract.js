require('dotenv').config();
const { deployContract } = require('../services/blockchain.service');

async function main() {
    try {
        console.log('Starting contract deployment...');
        const contractAddress = await deployContract();
        console.log('Contract deployed successfully!');
        console.log('Contract address:', contractAddress);
        console.log('\nAdd this contract address to your .env file as CONTRACT_ADDRESS=', contractAddress);
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

main(); 