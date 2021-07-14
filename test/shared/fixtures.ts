/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 22:10:09
 * @LastEditTime: 2021-07-13 22:12:51
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/test/shared/fixtures.ts
 */

import { Web3Provider } from "@ethersproject/providers";
import { deployContract} from "ethereum-waffle";
import { Contract, Wallet } from "ethers";
import { parseEther } from "@ethersproject/units";

import Entropy from "../../artifacts/contracts/entropy.sol/Entropy.json";

const overrides = {
    gasLimit: 999999999999999,
}

interface EntropyFixture {
    ERPToken: Contract;   
}

export async function v2Fixture([wallet]: Wallet[], provider: Web3Provider): Promise<EntropyFixture> {
    

    const ERPToken = await deployContract(wallet, Entropy, [], overrides);

    return {
        ERPToken
    };

}
