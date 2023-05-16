import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

const private_key = process.env.PRIVATE_KEY;
// const local_mnemonic = process.env.LOCAL_MNEMONIC;
// const bsc_testnet = process.env.BSC_TESTNET_URL;
// const mainnet_url = process.env.MAINNET_URL;
// const ddtestnet_url = process.env.DD_TESTNET_URL;
const testnet_url = process.env.TESTNET_URL;
const etherscan_api_key = process.env.BSCSCAN_API_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version: "0.4.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
    ],
  },
  networks: {
    // localhost: {
    //   url: "http://127.0.0.1:8545",
    //   accounts:
    //     { mnemonic: local_mnemonic }
    // },
    // bsc_testnet: {
    //   url: bsc_testnet || "",
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    // mainnet: {
    //   url: mainnet_url,
    //   accounts: private_key !== undefined ? [private_key] : []
    // },
    // digitaldollar: {
    //   url: ddtestnet_url,
    //   accounts: private_key !== undefined ? [private_key] : []
    // }
    digitaldollar: {
      url: testnet_url,
      accounts: private_key !== undefined ? [private_key] : []
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: etherscan_api_key,
  },
};

export default config;
