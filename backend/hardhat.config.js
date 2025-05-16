require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [ADMIN_PRIVATE_KEY],
    },
  },
};