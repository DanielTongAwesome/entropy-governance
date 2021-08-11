/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-08-04 13:57:02
 * @LastEditTime: 2021-08-04 14:04:33
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/scripts/kovan/deploy_veToken.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts} = hre;
const { getContractFactory } = ethers;
import { chainName } from "../constants";
import { BigNumber } from "ethers";

require("dotenv").config({ path: require("find-config")("../.env") });

async function main() {

    const voteVester = process.env.VOTEVESTER;
    const chainId = parseInt(await getChainId(), 10);
    const {account, minter} = await getNamedAccounts();

    console.log("\n==========================================================================================");
    console.log(`network: ${chainName(chainId)}`);
    console.log("==========================================================================================\n");


    console.log("\n==========================================================================================");
    console.log(`start deploying veEntropy Token`);
    console.log("==========================================================================================\n");

    const veEntropyERC20 = await getContractFactory('veEntropy');
    const veGovernanceToken = await veEntropyERC20.deploy(voteVester);

    console.log("\n==========================================================================================");
    console.log(`deployed token at ${veGovernanceToken.address}`);
    console.log("==========================================================================================\n");

    console.log("Deployment ALL DONE !!!!!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });