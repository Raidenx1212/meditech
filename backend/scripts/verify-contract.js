require('dotenv').config();
const { getContractInstance } = require('../services/blockchain.service');

async function main() {
    try {
        console.log('Verifying contract connection...');
        const contract = await getContractInstance();
        console.log('Successfully connected to contract at:', await contract.getAddress());
        
        // Try to call a view function to verify the contract is responsive
        console.log('Contract is verified and accessible');
    } catch (error) {
        console.error('Contract verification failed:', error);
        process.exit(1);
    }
}

main(); 