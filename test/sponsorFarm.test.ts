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
		it("# add ", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, false)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.poolLength()).to.be.eq(1);
			expect(await sponsorFarm.add(2, testToken1.address, false)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.poolLength()).to.be.eq(2);
		});

		it(" # deposit, claim", async () => {
			expect(await sponsorFarm.add(1, testToken0.address, false)).to.emit(sponsorFarm, "LogPoolAddition");
			expect(await sponsorFarm.add(2, testToken1.address, false)).to.emit(sponsorFarm, "LogPoolAddition");
			await testToken0.mint(wallet1.address, parseEther("1"));
			await testToken0.mint(wallet2.address, parseEther("1"));
			await testToken1.mint(wallet2.address, parseEther("2"));
			await testToken0.connect(wallet2).approve(sponsorFarm.address, MaxUint256);
			await testToken0.connect(wallet1).approve(sponsorFarm.address, MaxUint256);
			await testToken1.connect(wallet2).approve(sponsorFarm.address, MaxUint256);

			// every transaction will increase 1 blocknumber
			// wallet1 deposit 0.5eth to pid 0

			console.log(await provider.getBlockNumber());
			expect(await sponsorFarm.connect(wallet1).deposit(0, parseEther("0.5")))
				.emit(sponsorFarm, "Deposit")
				.withArgs(wallet1.address, 0, parseEther("0.5"));
			expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(0);
			console.log(await provider.getBlockNumber());

			// at blockNumber 1, wallet2 deposit 1eth to pid 1
			const blockNo1 = await provider.getBlockNumber();
			expect(await sponsorFarm.connect(wallet2).deposit(1, parseEther("1")))
				.emit(sponsorFarm, "Deposit")
				.withArgs(wallet2.address, 1, parseEther("1"));

			// check for rewards at blockNo2 and also wallet 2 deposit 0.5 eth to pid 0
			const blockNo2 = await provider.getBlockNumber();
			expect(await sponsorFarm.pendingEntropy(1, wallet1.address)).to.be.eq(0);

			expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(parseEther("10").mul(blockNo2 - blockNo1));

			await sponsorFarm.connect(wallet2).deposit(0, parseEther("0.5"));
			expect(await sponsorFarm.pendingEntropy(0, wallet2.address)).to.be.eq(0);
			const blockNo3 = await provider.getBlockNumber();
			await provider.send("evm_mine", []);

			// wallet 1 and wallet 2 split the rewards for pid0 from now on form block3 to block4
			const blockNo4 = await provider.getBlockNumber();
			expect(await sponsorFarm.pendingEntropy(0, wallet1.address)).to.be.eq(
				parseEther("10")
					.mul(blockNo3 - blockNo1)
					.add(parseEther("5").mul(blockNo4 - blockNo3))
			);
			expect(await sponsorFarm.pendingEntropy(0, wallet2.address)).to.be.eq(parseEther("5").mul(blockNo4 - blockNo3));
			expect(await sponsorFarm.pendingEntropy(1, wallet2.address)).to.be.eq(parseEther("20").mul(blockNo4 - blockNo2));

			// so they should be able to claim those pending rewards

      expect(await sponsorFarm.connect(wallet1).claim(0))
				.to.emit(sponsorFarm, "Claim")
				.withArgs(
					wallet1.address,
					0,
					parseEther("10")
						.mul(blockNo3 - blockNo1)
						.add(parseEther("5").mul(blockNo4 - blockNo3))
				);

        const blockNo5 = await provider.getBlockNumber();
        // console.log("4, 5", blockNo4, blockNo5);

        expect(await sponsorFarm.connect(wallet2).claim(0))
					.to.emit(sponsorFarm, "Claim")
					.withArgs(wallet2.address, 0, parseEther("5").mul(blockNo4 - blockNo3).add(parseEther('10').mul(blockNo5 - blockNo4)));

          
          const blockNo6 = await provider.getBlockNumber();

          // expect(await sponsorFarm.connect(wallet2).claim(1))
					// 	.to.emit(sponsorFarm, "Claim")
					// 	.withArgs(wallet2.address, 1, parseEther("20").mul(blockNo6 - blockNo2));

			// console.log(await provider.getBlockNumber());
		});
	});
});
