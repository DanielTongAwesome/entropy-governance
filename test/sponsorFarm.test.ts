import { expect } from "chai";
import { MockProvider, createFixtureLoader } from "ethereum-waffle";
import { Entropy, EntropySponsorFarm, TreasuryVester } from "../types";
import { v2Fixture } from "./shared/fixtures";
import { parseEther } from "ethers/lib/utils";

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
	const entropyPerBlock = parseEther("20");

	let erpToken: Entropy;
	let sponsorFarm: EntropySponsorFarm;

	beforeEach(async () => {
		await provider.send("evm_mine", [startTime]);
	});

	beforeEach(async () => {
		const fixture = await loadFixture(v2Fixture);
		erpToken = fixture.erpToken;
		sponsorFarm = fixture.sponsorFarm;
	});

	describe("EntropySponsorFarm deployed", async () => {
    it(" check variables", async () => {
      expect(await sponsorFarm.entropy()).to.be.eq(erpToken.address);
			expect(await sponsorFarm.entropyPerBlock()).to.be.eq(entropyPerBlock);
    })
		
	});

  

});
