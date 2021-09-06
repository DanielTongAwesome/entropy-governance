import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-contract-sizer";

require("@nomiclabs/hardhat-etherscan");

import { networks } from "./hardhat.networks";
require("dotenv").config({ path: require("find-config")("./.env") });

// for token deploy
const ACCOUNT = process.env.ACCOUNT;
const MINTER = process.env.MINTER;

// for treasury vester deploy
const REP_ADDRESS = process.env.REP_ADDRESS;
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;

const config = {
	solidity: {
		compilers: [
			{
				version: "0.8.2",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
			{
				version: "0.5.16",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		],
	},

	contractSizer: {
		alphaSort: true,
		runOnCompile: false,
		disambiguatePaths: false,
	},

	paths: {
		sources: "./contracts", // for governance
		// sources: "./contracts/vesting", // for vesting
		// sources: "./contracts/mining", // for mining

		artifacts: "./artifacts",
		// tests: "./test"
		// deploy: 'deploy',
	},

	typechain: {
		outDir: "types",
		target: "ethers-v5",
	},

	namedAccounts: {
		account: {
			default: ACCOUNT,
			1: ACCOUNT,		// ETH Mainnet
			42: ACCOUNT,	// ETH-Kovan
			137: ACCOUNT,	// MATIC Mainnet
			80001: ACCOUNT,	// MATIC Mumbai
			421611: ACCOUNT,// Arbitrum Testnet
		},

		minter: {
			default: MINTER,
			1: MINTER,
			42: MINTER,
			137: MINTER,
			80001: MINTER,
			421611: MINTER,
		},

		rep: {
			default: REP_ADDRESS,
			1: REP_ADDRESS,
			42: REP_ADDRESS,
			137: REP_ADDRESS,
			80001: REP_ADDRESS,
			421611: REP_ADDRESS,
		},

		recipient: {
			default: RECIPIENT_ADDRESS,
			1: RECIPIENT_ADDRESS,
			42: RECIPIENT_ADDRESS,
			137: RECIPIENT_ADDRESS,
			80001: RECIPIENT_ADDRESS,
			421611: RECIPIENT_ADDRESS,
		},
	},

	etherscan: {
		apiKey: process.env.ETHERSCAN_API,
	},

	networks,

	mocha: {
		timeout: 30000,
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
