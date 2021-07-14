/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 22:37:34
 * @LastEditTime: 2021-07-13 22:39:22
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/scripts/deploy.ts
 */
import hre from "hardhat";
const { ethers, getChainId, waffle, getNamedAccounts} = hre;
const { getSigner, getContractFactory } = ethers;
import { parseEther, formatEther} from "ethers/lib/utils";
import { chainName } from "./constants";

require("dotenv").config({ path: require("find-config")("../.env") });

async function main() {

    const chainId = parseInt(await getChainId(), 10);
    const {admin1, admin2, admin3} = await getNamedAccounts();

    console.log("\n==========================================================================================");
    console.log(`network: ${chainName(chainId)}`);
    console.log("==========================================================================================\n");


    console.log("\n==========================================================================================");
    console.log(`start deploying Test Principal Token`);
    console.log("==========================================================================================\n");

    const EntropyERC20 = await getContractFactory('Entropy');
    const GovernanceToken = await EntropyERC20.deploy();

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