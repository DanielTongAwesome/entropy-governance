/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 22:10:09
 * @LastEditTime: 2021-07-14 17:30:19
 * @LastEditors: Zitian(Daniel) Tong
 * @Description:
 * @FilePath: /entropy-governance/test/shared/fixtures.ts
 */

import { Web3Provider } from "@ethersproject/providers";
import { deployContract } from "ethereum-waffle";
import { Contract, Wallet } from "ethers";
import { parseEther } from "@ethersproject/units";

import Entropy from "../../artifacts/contracts/Entropy.sol/Entropy.json";

require("dotenv").config({ path: require("find-config")("../.env") });

const overrides = {
	gasLimit: 999999999999999,
};

interface EntropyFixture {
	ERPToken: Contract;
}

export async function v2Fixture([wallet]: Wallet[], provider: Web3Provider): Promise<EntropyFixture> {
	const ACCOUNT = process.env.ACCOUNT;
	const MINTER = process.env.MINTER;
	const afterTime = process.env.MINTINGALLOWEDAFTER;

	const ERPToken = await deployContract(wallet, Entropy, [ACCOUNT, MINTER, afterTime], overrides);

	return {
		ERPToken,
	};
}
