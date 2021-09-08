/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-15 01:07:24
 * @LastEditTime: 2021-09-08 11:36:14
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
	const { erp, recipient, vestAmount, vestBegin, vestClif, vestEnd } = await getNamedAccounts();

	console.log("\n==========================================================================================");
	console.log(`network: ${chainName(chainId)}`);
	console.log("==========================================================================================\n");

	console.log("\n==========================================================================================");
	console.log(`start deploying Treasury Vester Contract`);
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
	console.log(`token address: 	${erp}`);
	console.log(`recipient address: ${recipient}`);
	console.log(`vesting amount: 	${vestAmount}`);
	console.log(`vesting begin:	 	${vestBegin}`);
	console.log(`vesting clif: 		${vestClif}`);
	console.log(`vesting end: 		${vestEnd}`);
	console.log("==========================================================================================\n");

	console.log("Deployment ALL DONE !!!!!!");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
