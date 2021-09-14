import { Web3Provider } from "@ethersproject/providers";
import { Wallet } from "ethers";
import { Entropy, Entropy__factory, TreasuryVester, TreasuryVester__factory } from "../../types";
import { ethers, waffle, getNamedAccounts } from "hardhat";
import { parseEther } from "ethers/lib/utils";
const {getContractFactory} = ethers
const {deployContract} = waffle

require("dotenv").config({ path: require("find-config")("../.env") });

const overrides = {
	gasLimit: 999999999999999,
};

interface EntropyFixture {
	erpToken: Entropy;
	treasuryVester: TreasuryVester
}

export async function v2Fixture([account, wallet1]: Wallet[], provider: Web3Provider): Promise<EntropyFixture> {
	const afterTime = 1660249050;


	// has some known bugs when using getContract factory: it will think different wallets share the same signer
	// const ERPTokenFactory = await getContractFactory("Entropy",account) 
	// const ERPToken = await ERPTokenFactory.deploy(account.address, account.address, afterTime) as Entropy
	const vestingAmount = parseEther('100');
	const vestingBegin = 1627794720;
	const vestingCliff = vestingBegin + 60;
	const vestingEnd = 1659330720;

	const erpToken = (await deployContract(account, Entropy__factory, [account.address, account.address, afterTime])) as Entropy;
	const treasuryVester = (await deployContract(account, TreasuryVester__factory, [
		erpToken.address,
		wallet1.address,
		vestingAmount,
		vestingBegin,
		vestingCliff,
		vestingEnd,
	])) as TreasuryVester;
	return {
		erpToken,
		treasuryVester
	};
}
