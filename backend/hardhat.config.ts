import { HardhatUserConfig } from "hardhat/config";
import toolboxPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const networks: HardhatUserConfig["networks"] = {};

if (process.env.SEPOLIA_RPC_URL && process.env.SEPOLIA_RPC_URL.trim().length > 0) {
  networks.sepolia = {
    type: "http",
    url: process.env.SEPOLIA_RPC_URL,
    accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
  };
}

const config: HardhatUserConfig = {
  plugins: [toolboxPlugin],
  solidity: "0.8.28",
  paths: {
    artifacts: "../frontend/src/artifacts",
  },
  networks,
};

export default config;