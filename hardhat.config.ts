import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY?.trim();
const sepoliaAccounts =
  privateKey && /^0x[0-9a-fA-F]{64}$/.test(privateKey) ? [privateKey] : [];

const config = defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    compilers: [{ version: "0.8.24" }, { version: "0.8.28" }],
  },
  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: sepoliaAccounts,
    },
  },
});

export default config;