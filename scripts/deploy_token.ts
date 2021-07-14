/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 22:37:34
 * @LastEditTime: 2021-07-14 17:26:49
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/scripts/deploy_token.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts} = hre;
const { getContractFactory } = ethers;
import { chainName } from "./constants";
import { BigNumber } from "ethers";

require("dotenv").config({ path: require("find-config")("../.env") });

async function main() {

    const afterTime = process.env.MINTINGALLOWEDAFTER;
    const chainId = parseInt(await getChainId(), 10);
    const {account, minter} = await getNamedAccounts();

    console.log("\n==========================================================================================");
    console.log(`network: ${chainName(chainId)}`);
    console.log("==========================================================================================\n");


    console.log("\n==========================================================================================");
    console.log(`start deploying Entropy Governance Token`);
    console.log("==========================================================================================\n");

    const EntropyERC20 = await getContractFactory('Entropy');
    const GovernanceToken = await EntropyERC20.deploy(account, minter, BigNumber.from(afterTime));

    console.log("\n==========================================================================================");
    console.log(`deployed token at ${GovernanceToken.address}`);
    console.log("==========================================================================================\n");

    console.log("Deployment ALL DONE !!!!!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });