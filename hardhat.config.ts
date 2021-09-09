import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-contract-sizer";

require("@nomiclabs/hardhat-etherscan");

import { networks } from "./hardhat.networks";
require("dotenv").config({ path: require("find-config")("./.env") });

// for token deploy
const ACCOUNT = process.env.ACCOUNT || "";
const MINTER = process.env.MINTER || "";
const MINTINGALLOWEDAFTER = process.env.MINTINGALLOWEDAFTER || "";

// for sponsor farming deploy
const ENTROPY_ADDRESS = process.env.ENTROPY_ADDRESS || "";
const ENTROPY_PER_BLOCK = process.env.ENTROPY_PER_BLOCK || "";

// for treasury vester deploy
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS || "";
const VESTING_AMOUNT = process.env.VESTING_AMOUNT || "";
const VESTING_BEGIN = process.env.VESTING_BEGIN || "";
const VESTING_CLIFF = process.env.VESTING_CLIFF || "";
const VESTING_END = process.env.VESTING_END || "";

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

		timeAfter: {
			default: MINTINGALLOWEDAFTER,
			1: MINTINGALLOWEDAFTER,		// ETH Mainnet
			42: MINTINGALLOWEDAFTER,	// ETH-Kovan
			137: MINTINGALLOWEDAFTER,	// MATIC Mainnet
			80001: MINTINGALLOWEDAFTER,	// MATIC Mumbai
			421611: MINTINGALLOWEDAFTER,// Arbitrum Testnet
		},

		minter: {
			default: MINTER,
			1: MINTER,
			42: MINTER,
			137: MINTER,
			80001: MINTER,
			421611: MINTER,
		},

		erp: {
			default: ENTROPY_ADDRESS,
			1: ENTROPY_ADDRESS,
			42: ENTROPY_ADDRESS,
			137: ENTROPY_ADDRESS,
			80001: ENTROPY_ADDRESS,
			421611: ENTROPY_ADDRESS,
		},

		perBlock: {
			default: ENTROPY_PER_BLOCK,
			1: ENTROPY_PER_BLOCK,
			42: ENTROPY_PER_BLOCK,
			137: ENTROPY_PER_BLOCK,
			80001: ENTROPY_PER_BLOCK,
			421611: ENTROPY_PER_BLOCK,
		},

		recipient: {
			default: RECIPIENT_ADDRESS,
			1: RECIPIENT_ADDRESS,
			42: RECIPIENT_ADDRESS,
			137: RECIPIENT_ADDRESS,
			80001: RECIPIENT_ADDRESS,
			421611: RECIPIENT_ADDRESS,
		},

		vestAmount: {
			default: VESTING_AMOUNT,
			1: VESTING_AMOUNT,
			42: VESTING_AMOUNT,
			137: VESTING_AMOUNT,
			80001: VESTING_AMOUNT,
			421611: VESTING_AMOUNT,
		},

		vestBegin: {
			default: VESTING_BEGIN,
			1: VESTING_BEGIN,
			42: VESTING_BEGIN,
			137: VESTING_BEGIN,
			80001: VESTING_BEGIN,
			421611: VESTING_BEGIN,
		},

		vestClif: {
			default: VESTING_CLIFF,
			1: VESTING_CLIFF,
			42: VESTING_CLIFF,
			137: VESTING_CLIFF,
			80001: VESTING_CLIFF,
			421611: VESTING_CLIFF,
		},

		vestEnd: {
			default: VESTING_END,
			1: VESTING_END,
			42: VESTING_END,
			137: VESTING_END,
			80001: VESTING_END,
			421611: VESTING_END,
		},
	},

	etherscan: {
		apiKey: process.env.ETHERSCAN_API,
		// apiKey: process.env.POLYSCAN_API,
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
