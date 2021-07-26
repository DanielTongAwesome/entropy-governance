/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-23 01:00:41
 * @LastEditTime: 2021-07-25 10:39:17
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/scripts/kovan/deploy_lp_farm.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts} = hre;
const { getContractFactory } = ethers;
import { chainName } from "../constants";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";

require("dotenv").config({ path: require("find-config")("../.env") });

async function main() {

    const ENTROPY_ADDRESS = process.env.ENTROPY_ADDRESS || "";
    const ENTROPY_PER_BLOCK = process.env.ENTROPY_PER_BLOCK;
    
    const chainId = parseInt(await getChainId(), 10);
    const {rep, recipient} = await getNamedAccounts();

    console.log("\n==========================================================================================");
    console.log(`network: ${chainName(chainId)}`);
    console.log("==========================================================================================\n");


    console.log("\n==========================================================================================");
    console.log(`start deploying Liquidity Farming Contract`);
    console.log("==========================================================================================\n");

    const spFarm = await getContractFactory('EntropyLiquidityFarm');
    const sponsorFarm = await spFarm.deploy(ENTROPY_ADDRESS, BigNumber.from(ENTROPY_PER_BLOCK));

    console.log("\n==========================================================================================");
    console.log(`deployed Liquidity Farming Contract at ${sponsorFarm.address}`);
    console.log("==========================================================================================\n");

    console.log("Deployment ALL DONE !!!!!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });