require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200  // This reduces contract size and gas
      }
    }
  },
  networks: {
    didlab: {
      url: process.env.RPC_URL || "https://eth.didlab.org",
      chainId: 252501,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000,
      gas: 8000000,  // Added gas limit
      timeout: 120000,  // 2 minutes timeout
      httpHeaders: {}
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};