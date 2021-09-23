import { expect } from "chai";
import { MockProvider, createFixtureLoader } from "ethereum-waffle";
import { Entropy, EntropySponsorFarm, TestToken, TreasuryVester } from "../types";
import { v2Fixture } from "./shared/fixtures";
import { formatEther, parseEther } from "ethers/lib/utils";
import { AddressZero, MaxUint256 } from "@ethersproject/constants";

describe(" TEST: EntropySponsorFarm", async () => {
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
	const entropyPerBlock = parseEther("30");

	let erpToken: Entropy;
	let sponsorFarm: EntropySponsorFarm;
	let testToken0: TestToken;
	let testToken1: TestToken;

	beforeEach(async () => {
		await provider.send("evm_mine", [startTime]);
	});

	beforeEach(async () => {
		const fixture = await loadFixture(v2Fixture);
		erpToken = fixture.erpToken;
		sponsorFarm = fixture.sponsorFarm;
		testToken0 = fixture.testToken0;
		testToken1 = fixture.testToken1;
		await erpToken.transfer(sponsorFarm.address, parseEther("1000"));
	});

	describe("EntropySponsorFarm deployed", async () => {
		it(" check variables", async () => {
			expect(await sponsorFarm.entropy()).to.be.eq(erpToken.address);
			expect(await sponsorFarm.entropyPerBlock()).to.be.eq(entropyPerBlock);
		});

		it("initial pool length", async () => {
			expect(await sponsorFarm.poolLength()).to.be.eq(0);
		});
	});

	describe("test with testToken0 and testToken1", async () => {
		beforeEach(async () => {
			await testToken0.mint(wallet1.address, parseEther("1"));
			await testToken0.mint(wallet2.address, parseEther("1"));
			await testToken1.mint(wallet2.address, parseEther("2"));
			await testToken0.connect(wallet2).approve(sponsorFarm.address, MaxUint256);
			await testToken0.connect(wallet1).approve(sponsorFarm.address, MaxUint256);
			await testToken1.connect(wallet2).approve(sponsorFarm.address, MaxUint256);
		});
		it("# add ", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, false)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.poolLength()).to.be.eq(1);
			expect(await sponsorFarm.add(2, testToken1.address, false)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.poolLength()).to.be.eq(2);
		});

		it(" # deposit, pendingEntropy, claim: only wallet1 at pid 0", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.add(2, testToken1.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			await sponsorFarm.connect(wallet1).deposit(0, parseEther("0.5"));
			const block1 = await provider.getBlockNumber();

			await provider.send("evm_mine", []);
			await provider.send("evm_mine", []);

			const block2 = await provider.getBlockNumber();

			// check pending rewards
			const expectedRewards = parseEther("10").mul(block2 - block1);
			expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(expectedRewards);
			// claim
			await sponsorFarm.connect(wallet1).claim(0);
			// it alse give rewards you at the block when you claim.
			const extraRewards = parseEther("10");
			// check if balance matches the rewards
			expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(expectedRewards.add(extraRewards));
		});

		it(" # deposit, pendingEntropy, claim: only wallet2 at pid1", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.add(2, testToken1.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			await sponsorFarm.connect(wallet2).deposit(1, parseEther("0.5"));
			const block1 = await provider.getBlockNumber();

			await provider.send("evm_mine", []);
			await provider.send("evm_mine", []);

			// check pending rewards
			const expectedRewards = parseEther("20").mul(2);

			expect(await sponsorFarm.pendingEntropy(1, wallet2.address)).to.be.eq(expectedRewards);

			// claim
			await sponsorFarm.connect(wallet2).claim(1);
			// it alse give rewards you at the block when you claim.
			const extraRewards = parseEther("20");
			// check if balance matches the rewards
			expect(await erpToken.balanceOf(wallet2.address)).to.be.eq(expectedRewards.add(extraRewards));
		});

		it(" # deposit, pendingEntropy, claim: wallet1 at pid0, wallet2 at pid1", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.add(2, testToken1.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			await sponsorFarm.connect(wallet1).deposit(0, parseEther("0.5"));
			await sponsorFarm.connect(wallet2).deposit(1, parseEther("0.5"));
			const block1 = await provider.getBlockNumber();

			await provider.send("evm_mine", []);
			await provider.send("evm_mine", []);

			// check pending rewards
			const expectedRewards1 = parseEther("10").mul(3);
			const expectedRewards2 = parseEther("20").mul(2);
			expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(expectedRewards1);
			expect(await sponsorFarm.pendingEntropy(1, wallet2.address)).to.be.eq(expectedRewards2);

			// claim
			await sponsorFarm.connect(wallet1).claim(0);
			await sponsorFarm.connect(wallet2).claim(1);
			// it alse give rewards you at the block when you claim.
			const extraRewards1 = parseEther("10").mul(1);
			const extraRewards2 = parseEther("20").mul(2);
			// check if balance matches the rewards
			expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(expectedRewards1.add(extraRewards1));
			expect(await erpToken.balanceOf(wallet2.address)).to.be.eq(expectedRewards2.add(extraRewards2));
		});

		it(" # deposit, pendingEntropy, claim: wallet1, wallet2 at pid0", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.add(2, testToken1.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			await sponsorFarm.connect(wallet1).deposit(0, parseEther("0.5"));
			await provider.send("evm_mine", []);
			await provider.send("evm_mine", []);
			await sponsorFarm.connect(wallet2).deposit(0, parseEther("0.5"));

			await provider.send("evm_mine", []);
			await provider.send("evm_mine", []);

			// check pending rewards
			const expectedRewards1 = parseEther("10").mul(3).add(parseEther("5").mul(2));
			const expectedRewards2 = parseEther("5").mul(2);
			expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(expectedRewards1);
			expect(await sponsorFarm.pendingEntropy(0, wallet2.address)).to.be.eq(expectedRewards2);

			// claim
			await sponsorFarm.connect(wallet1).claim(0);
			await sponsorFarm.connect(wallet2).claim(0);
			// it alse give rewards you at the block when you claim.
			const extraRewards1 = parseEther("5").mul(1);
			const extraRewards2 = parseEther("5").mul(2);
			// check if balance matches the rewards
			expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(expectedRewards1.add(extraRewards1));
			expect(await erpToken.balanceOf(wallet2.address)).to.be.eq(expectedRewards2.add(extraRewards2));
		});

		it(" # deposit, pendingEntropy, withdraw, claim: wallet1, wallet2 at pid0, wallet1 withdraw all then wallet2 claim", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.add(2, testToken1.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
			await sponsorFarm.connect(wallet1).deposit(0, parseEther("0.5"));
			await provider.send("evm_mine", []);
			await provider.send("evm_mine", []);
			await sponsorFarm.connect(wallet2).deposit(0, parseEther("0.5"));

			await provider.send("evm_mine", []);
			await provider.send("evm_mine", []);

			// check pending rewards
			const expectedRewards1 = parseEther("10").mul(3).add(parseEther("5").mul(2));
			const expectedRewards2 = parseEther("5").mul(2);
			expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(expectedRewards1);
			expect(await sponsorFarm.pendingEntropy(0, wallet2.address)).to.be.eq(expectedRewards2);
			
			// wallet 1 withdraw all
			await sponsorFarm.connect(wallet1).withdraw(0, parseEther('0.5'));
			const extraRewards1 = parseEther("5").mul(1);
			// check balance
			expect(await testToken0.balanceOf(wallet1.address)).to.be.eq(parseEther('1'))
			expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(expectedRewards1.add(extraRewards1));  // 30+10+5 = 45
			// check balance after claim (should claim 0 token because all withdrawed)
			expect(await sponsorFarm.connect(wallet1).claim(0))
			expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(expectedRewards1.add(extraRewards1));

			// wallet2 claim
			await sponsorFarm.connect(wallet2).claim(0);
			const extraRewards2 = parseEther("5").mul(1).add(parseEther('10').mul(2));
			// check if balance matches the rewards
			// expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(expectedRewards1.add(extraRewards1));
			expect(await erpToken.balanceOf(wallet2.address)).to.be.eq(expectedRewards2.add(extraRewards2));
		});

			it(" # deposit, pendingEntropy, emergencyWithdraw claim: only wallet1 at pid 0", async () => {
				expect(await sponsorFarm.add(1, testToken0.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
				expect(await sponsorFarm.add(2, testToken1.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
				await sponsorFarm.connect(wallet1).deposit(0, parseEther("1"));
				expect(await testToken0.balanceOf(wallet1.address)).to.be.eq(0);

				await provider.send("evm_mine", []);
				await provider.send("evm_mine", []);


				// check pending rewards
				const expectedRewards = parseEther("10").mul(2);
				expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(expectedRewards);
				await sponsorFarm.connect(wallet1).emergencyWithdraw(0);
				expect(await testToken0.balanceOf(wallet1.address)).to.be.eq(parseEther("1"));
				
				// claim
				await sponsorFarm.connect(wallet1).claim(0);
				// check if balance matches the rewards
				expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(0);
			});

			it(" # deposit, pendingEntropy, emergencyWithdraw claim: wallet1, wallet2 at pid0", async () => {
				expect(await sponsorFarm.add(1, testToken0.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
				expect(await sponsorFarm.add(2, testToken1.address, true)).to.emit(sponsorFarm, "LogPoolAddition");
				await sponsorFarm.connect(wallet1).deposit(0, parseEther("0.5"));
				expect(await testToken0.balanceOf(wallet1.address)).to.be.eq(parseEther("0.5"));
				await provider.send("evm_mine", []);
				await provider.send("evm_mine", []);
				await provider.send("evm_mine", []);
				await provider.send("evm_mine", []);
				
				await sponsorFarm.connect(wallet2).deposit(0, parseEther("0.5"));
				expect(await testToken0.balanceOf(wallet2.address)).to.be.eq(parseEther("0.5"));

				await provider.send("evm_mine", []);
				await provider.send("evm_mine", []);
				await provider.send("evm_mine", []);
				

				// check pending rewards
				const expectedRewards1 = parseEther("10").mul(5).add(parseEther("5").mul(3));
				const expectedRewards2 = parseEther("5").mul(3);
				expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(expectedRewards1);
				expect(await sponsorFarm.pendingEntropy(0, wallet2.address)).to.be.eq(expectedRewards2);

				// wallet1 gave up the rewards 

				await sponsorFarm.connect(wallet1).emergencyWithdraw(0);
				expect(await testToken0.balanceOf(wallet1.address)).to.be.eq(parseEther("1"));
				// claim
				await sponsorFarm.connect(wallet1).claim(0);
				await sponsorFarm.connect(wallet2).claim(0);

				// it alse give rewards you at the block when you claim.
				// check if balance matches the rewards

				const fullRewards = parseEther("10").mul(11)
				const rewardsGivenUp = parseEther("10").mul(5)
				expect(await erpToken.balanceOf(wallet1.address)).to.be.eq(0);
				expect(await erpToken.balanceOf(wallet2.address)).to.be.eq(fullRewards.sub(rewardsGivenUp));
			});

	});
});
