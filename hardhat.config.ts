/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 00:35:06
 * @LastEditTime: 2021-07-13 22:35:26
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/hardhat.config.ts
 */
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-contract-sizer";


require("@nomiclabs/hardhat-etherscan");

import {networks} from "./hardhat.networks";
require("dotenv").config({  path: require("find-config")("./.env") });

const ADMIN1 = process.env.ADMIN1;
const ADMIN2 = process.env.ADMIN2;
const ADMIN3 = process.env.ADMIN3;

const config = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "istanbul"
    }
  },

  contractSizer: {
		alphaSort: true,
		runOnCompile: true,
		disambiguatePaths: false,
	},
  
  paths: {
    sources: "./src/contracts",
    artifacts: "./src/artifacts"
    // tests: "./test/mainnet" // test on forked mainnet
    // deploy: 'deploy',
  },

  namedAccounts: {
    // deployer: {  // check on chainid https://chainid.network/
    //   default: 0,  // first account as deployer
    //   1: 0, // Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    // },

    admin1: {
      default: ADMIN1,
      1: ADMIN1
    },

    admin2: {
      default: ADMIN2,
    },

    admin3: {
      default: ADMIN3,
    },
    
    currency: {
      1:"0xdac17f958d2ee523a2206206994597c13d831ec7",
      42:"0xf3e0d7bf58c5d455d31ef1c2d5375904df525105"
    }
  },

  typechain: {
    outDir: "types",
    target: "ethers-v5"
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API

  },

  networks,

  mocha: {
    timeout: 30000
  },

  // external: process.env.HARDHAT_FORK
  //   ? {
  //       deployments: {
  //         // process.env.HARDHAT_FORK will specify the network that the fork is made from.
  //         // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
  //         hardhat: ['deployments/' + process.env.HARDHAT_FORK],
  //         localhost: ['deployments/' + process.env.HARDHAT_FORK],
  //       },
  //     }: undefined,
};

module.exports = config;
