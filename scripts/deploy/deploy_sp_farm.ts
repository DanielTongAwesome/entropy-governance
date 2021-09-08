/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-23 01:00:41
 * @LastEditTime: 2021-09-08 11:30:33
 * @LastEditors: Zitian(Daniel) Tong
 * @Description:
 * @FilePath: /entropy-governance/scripts/deploy/deploy_sp_farm.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts } = hre;
const { getContractFactory } = ethers;
import { chainName } from "../miscs/constants";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";

async function main() {
	const chainId = parseInt(await getChainId(), 10);
	const { erp, perBlock } = await getNamedAccounts();

	console.log("\n==========================================================================================");
	console.log(`network: ${chainName(chainId)}`);
	console.log("==========================================================================================\n");

	console.log("\n==========================================================================================");
	console.log(`start deploying Sponsor Farming Contract`);
	console.log("==========================================================================================\n");

	const spFarm = await getContractFactory("EntropySponsorFarm");
	const sponsorFarm = await spFarm.deploy(erp, BigNumber.from(perBlock));

	console.log("\n==========================================================================================");
	console.log(`deployed Sponsor Farming Contract at ${sponsorFarm.address}`);
	console.log(`token address: ${erp}`);
	console.log(`entropy per block: ${BigNumber.from(perBlock)}`)
	console.log("==========================================================================================\n");

	console.log("Deployment ALL DONE !!!!!!");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
