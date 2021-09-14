import { ethers, waffle, getNamedAccounts } from "hardhat";
const { getContractFactory, getSigner } = ethers;
const {} = waffle;
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { MockProvider, createFixtureLoader, deployContract } from "ethereum-waffle";
import { mineBlock, expandTo18Decimals } from "./shared/utils";
import { Entropy, TreasuryVester } from "../types";
import { v2Fixture } from "./shared/fixtures";
import { formatEther, parseEther } from "ethers/lib/utils";

describe("scenario:TreasuryVester", () => {
	const provider = new MockProvider({
		ganacheOptions: {
			hardfork: "istanbul",
			mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
			gasLimit: 999999999999999,
		},
	});

	const [account, wallet1, wallet2] = provider.getWallets();

	const loadFixture = createFixtureLoader([account, wallet1], provider);

	const startTime = 1609459200;

	let treasuryVester: TreasuryVester;
	let erpToken: Entropy;
	const vestingAmount = parseEther("100");
	const vestingBegin = 1627794720;
	const vestingCliff = vestingBegin + 60;
	const vestingEnd = 1659330720;

	

	beforeEach(async () => {
		await provider.send("evm_mine", [startTime]);
	});

	beforeEach(async () => {
		const fixture = await loadFixture(v2Fixture);
		treasuryVester = fixture.treasuryVester;
		erpToken = fixture.erpToken;
		
	});

	describe("treasuryVester deployed", async () => {
		it("check variable", async () => {
			expect(await treasuryVester.erp()).to.be.eq(erpToken.address);
			expect(await treasuryVester.recipient()).to.be.eq(wallet1.address);
			expect(await treasuryVester.vestingAmount()).to.be.eq(vestingAmount);
			expect(await treasuryVester.vestingBegin()).to.be.eq(vestingBegin);
			expect(await treasuryVester.vestingCliff()).to.be.eq(vestingCliff);
			expect(await treasuryVester.vestingEnd()).to.be.eq(vestingEnd);
		})
		
	});

	describe(" # setRecipient", async () => {
		it("revert with unauthorized", async () => {
			await expect(treasuryVester.connect(wallet2).setRecipient(wallet2.address)).to.be.revertedWith(
				"TreasuryVester::setRecipient: unauthorized"
			);
		});
		it("set new recipient", async () => {
			await treasuryVester.connect(wallet1).setRecipient(wallet2.address);
			expect(await treasuryVester.recipient()).to.be.eq(wallet2.address)
		})
	});

	describe(" # claim", async () => {
		beforeEach(async() => {
			await erpToken.transfer(treasuryVester.address, vestingAmount);
		})
		it ("revert when claim before vesting cliff", async () => {
			await expect(treasuryVester.claim()).to.be.revertedWith("TreasuryVester::claim: not time yet")
		})

		it("claim half ", async () => {
			// console.log("balance", formatEther(await erpToken.balanceOf(treasuryVester.address)))
			await provider.send("evm_mine", [vestingBegin + Math.floor((vestingEnd - vestingBegin) / 2)]);
			await treasuryVester.claim()
			const balance = await erpToken.balanceOf(wallet1.address)
			expect(vestingAmount.div(2).sub(balance).abs().lte(vestingAmount.div(2).div(10000))).to.be.true;
		})

			it("claim all", async () => {
				await provider.send("evm_mine", [vestingEnd]);
				await treasuryVester.claim();
				const balance = await erpToken.balanceOf(wallet1.address);
				expect(balance).to.be.eq(vestingAmount);
			});
	})

});
