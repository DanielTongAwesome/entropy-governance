/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-15 01:07:24
 * @LastEditTime: 2021-09-09 12:36:25
 * @LastEditors: Zitian(Daniel) Tong
 * @Description:
 * @FilePath: /entropy-governance/scripts/deploy/deploy_treasuryvester.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts } = hre;
const { getContractFactory } = ethers;
import { chainName } from "../miscs/constants";
import { BigNumber } from "ethers";

async function main() {
	const chainId = parseInt(await getChainId(), 10);

	const erp = "0xb9FA651d8b269D2822A500A7251AAbC277813fA7";
	const recipient = "0xfD9656df3E4Dca84C260137AECBA416050aea145";
	const vestAmount = 100000000;
	const vestBegin = 1627794720;
	const vestClif = 0;
	const vestEnd = 1659330720;

	console.log("\n==========================================================================================");
	console.log(`network: ${chainName(chainId)}`);
	console.log("==========================================================================================\n");

	console.log("\n==========================================================================================");
	console.log(`start deploying Treasury Vester Contract`);
	console.log(`token address: 	${erp}`);
	console.log(`recipient address: ${recipient}`);
	console.log(`vesting amount: 	${vestAmount}`);
	console.log(`vesting begin:	 	${vestBegin}`);
	console.log(`vesting clif: 		${vestClif}`);
	console.log(`vesting end: 		${vestEnd}`);
	console.log("==========================================================================================\n");

	const vester = await getContractFactory("TreasuryVester");
	const TreasuryVester = await vester.deploy(
		erp,
		recipient,
		BigNumber.from(vestAmount),
		BigNumber.from(vestBegin),
		BigNumber.from(vestClif),
		BigNumber.from(vestEnd)
	);

	console.log("\n==========================================================================================");
	console.log(`deployed Treasury Vester Contract at ${TreasuryVester.address}`);
	console.log("==========================================================================================\n");

	console.log("Deployment ALL DONE !!!!!!");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
