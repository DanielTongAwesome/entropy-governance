/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 22:37:34
 * @LastEditTime: 2021-09-08 07:56:34
 * @LastEditors: Zitian(Daniel) Tong
 * @Description:
 * @FilePath: /entropy-governance/scripts/deploy/deploy_token.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts } = hre;
const { getContractFactory } = ethers;
import { chainName } from "../miscs/constants";
import { BigNumber } from "ethers";

async function main() {
	const chainId = parseInt(await getChainId(), 10);
	const { account, timeAfter, minter } = await getNamedAccounts();

	console.log("\n==========================================================================================");
	console.log(`network: ${chainName(chainId)}`);
	console.log("==========================================================================================\n");

	console.log("\n==========================================================================================");
	console.log(`start deploying Entropy Governance Token`);
	console.log("==========================================================================================\n");

	const EntropyERC20 = await getContractFactory("Entropy");
	const GovernanceToken = await EntropyERC20.deploy(account, minter, BigNumber.from(timeAfter));

	console.log("\n==========================================================================================");
	console.log(`deployed token at ${GovernanceToken.address}`);
	console.log(`Set the account: 			  ${account}`);
	console.log(`Set the minter: 			  ${minter}`);
	console.log(`Set the mintingAllowedAfter: ${BigNumber.from(timeAfter)}`)
	console.log("==========================================================================================\n");

	console.log("Deployment ALL DONE !!!!!!");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
