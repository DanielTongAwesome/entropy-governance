/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-15 01:07:24
 * @LastEditTime: 2021-07-15 01:19:29
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/scripts/deploy_treasuryvester.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts} = hre;
const { getContractFactory } = ethers;
import { chainName } from "./constants";
import { BigNumber } from "ethers";

require("dotenv").config({ path: require("find-config")("../.env") });

async function main() {

    const VESTING_AMOUNT = process.env.VESTING_AMOUNT;
    const VESTING_BEGIN = process.env.VESTING_BEGIN;
    const VESTING_CLIFF = process.env.VESTING_CLIFF;
    const VESTING_END = process.env.VESTING_END;


    const chainId = parseInt(await getChainId(), 10);
    const {rep, recipient} = await getNamedAccounts();

    console.log("\n==========================================================================================");
    console.log(`network: ${chainName(chainId)}`);
    console.log("==========================================================================================\n");


    console.log("\n==========================================================================================");
    console.log(`start deploying Treasury Vester Contract`);
    console.log("==========================================================================================\n");

    const vester = await getContractFactory('TreasuryVester');
    const TreasuryVester = await vester.deploy(rep, recipient, BigNumber.from(VESTING_AMOUNT), BigNumber.from(VESTING_BEGIN), BigNumber.from(VESTING_CLIFF), BigNumber.from(VESTING_END));

    console.log("\n==========================================================================================");
    console.log(`deployed Treasury Vester Contract at ${TreasuryVester.address}`);
    console.log("==========================================================================================\n");

    console.log("Deployment ALL DONE !!!!!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });