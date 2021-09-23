import { ethers, waffle, getNamedAccounts } from "hardhat";
const { getContractFactory, getSigner } = ethers;
const {} = waffle;
import { expect } from "chai";
import { MockProvider, createFixtureLoader, deployContract } from "ethereum-waffle";
import { BigNumber, Contract } from "ethers";
import { Entropy } from "../types";
import { v2Fixture } from "./shared/fixtures";
import { AddressZero, MaxUint256 } from "@ethersproject/constants";
import { defaultAbiCoder, hexlify, keccak256, parseEther, solidityPack, toUtf8Bytes } from "ethers/lib/utils";
import { ecsign } from "ethereumjs-util";

require("dotenv").config({ path: require("find-config")("../.env") });

const overrides = {
	gasLimit: 999999999999999,
};

describe("Test: Entropy ERC20", () => {
	const provider = new MockProvider({
		ganacheOptions: {
			hardfork: "istanbul",
			mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
			gasLimit: 999999999999999,
		},
	});

	const [account, wallet1, wallet2] = provider.getWallets();
	const loadFixture = createFixtureLoader([account, wallet1], provider);

	const afterTime = 1660249050;
	const startTime = 1609459200;

	let erpToken: Entropy;

	const DOMAIN_TYPEHASH = keccak256(toUtf8Bytes("EIP712Domain(string name,uint256 chainId,address verifyingContract)"));

	const PERMIT_TYPEHASH = keccak256(toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"));

	beforeEach(async () => {
		await provider.send("evm_mine", [startTime]);
	});

	beforeEach(async () => {
		const fixture = await loadFixture(v2Fixture);
		erpToken = fixture.erpToken;
	});

	describe("Deploy ERP ERC20 Token Smart Contract", async () => {
		it("should have correct token name", async () => {
			expect(await erpToken.name()).to.be.eq("Entropy");
		});

		it("should have correct token symbol", async () => {
			expect(await erpToken.symbol()).to.be.eq("ERP");
		});

		it("should have correct token decimals", async () => {
			expect(await erpToken.decimals()).to.be.eq(18);
		});

		it("should have correct token total supply", async () => {
			expect(await erpToken.totalSupply()).to.be.eq(parseEther("1000000000"));
		});

		it("should have correct minter", async () => {
			expect(await erpToken.minter()).to.be.eq(account.address);
		});

		it("should have correct account", async () => {
			expect(await erpToken.mintingAllowedAfter()).to.be.eq(afterTime);
		});

		it("should create 1B token to account", async () => {
			expect(await erpToken.balanceOf(account.address)).to.be.eq(parseEther("1000000000"));
		});
	});

	describe("# setMinter", async () => {
		it("revert with only the minter can change the minter address", async () => {
			// expect((await erpToken.connect(wallet1).setMinter(wallet1.address))).to.emit(erpToken, "MinterChanged"). withArgs(account.address, wallet2.address);
			expect(erpToken.connect(wallet2).setMinter(wallet1.address)).to.be.revertedWith(
				"Erp::setMinter: only the minter can change the minter address"
			);
		});

		it(" set new minter", async () => {
			// console.log("account wallet 1", account.address, wallet1.address)
			expect(await erpToken.setMinter(wallet1.address))
				.to.emit(erpToken, "MinterChanged")
				.withArgs(account.address, wallet1.address);
			expect(await erpToken.minter()).to.be.eq(wallet1.address);
		});
	});

	describe(" # mint", async () => {
		it("revert when non minter mint", async () => {
			expect(await erpToken.minter()).to.be.eq(account.address);
			await expect(erpToken.connect(wallet1).mint(wallet1.address, 1)).to.be.revertedWith("Erp::mint: only the minter can mint");
		});
		it("revert when mint before aftertime", async () => {
			await expect(erpToken.mint(wallet1.address, 1)).to.be.revertedWith("Erp::mint: minting not allowed yet");
		});
		it("revert when transfer to zero address", async () => {
			await provider.send("evm_mine", [afterTime]);
			await expect(erpToken.mint(AddressZero, 1)).to.be.revertedWith("Erp::mint: cannot transfer to the zero address");
		});

		it("revert when amount exceeds", async () => {
			await provider.send("evm_mine", [afterTime]);
			await expect(erpToken.mint(wallet1.address, MaxUint256)).to.be.revertedWith("Erp::mint: amount exceeds 96 bits");
			const baseAmount = parseEther("1000000000");
			const cap = baseAmount.mul(BigNumber.from(21)).div(BigNumber.from(1000)); // 2.1%
			await expect(erpToken.mint(wallet1.address, cap)).to.be.revertedWith("Erp::mint: exceeded mint cap");
		});

		it(" mint within mint cap", async () => {
			await provider.send("evm_mine", [afterTime]);
			await expect(erpToken.mint(wallet1.address, MaxUint256)).to.be.revertedWith("Erp::mint: amount exceeds 96 bits");
			const baseAmount = parseEther("1000000000");
			const cap = baseAmount.mul(BigNumber.from(20)).div(BigNumber.from(1000)); // 2%
			await erpToken.mint(account.address, cap);
			expect(await erpToken.balanceOf(account.address)).to.be.eq(baseAmount.add(cap));
		});
	});

	describe(" # permit", async () => {
		it("permit", async () => {
			const domainSeparator = keccak256(
				defaultAbiCoder.encode(
					["bytes32", "bytes32", "uint256", "address"],
					[DOMAIN_TYPEHASH, keccak256(toUtf8Bytes("Entropy")), 1, erpToken.address]
				)
			);

			const owner = account.address;
			const spender = wallet1.address;
			const value = 123;
			const nonce = await erpToken.nonces(account.address);
			const deadline = MaxUint256;
			const digest = keccak256(
				solidityPack(
					["bytes1", "bytes1", "bytes32", "bytes32"],
					[
						"0x19",
						"0x01",
						domainSeparator,
						keccak256(
							defaultAbiCoder.encode(
								["bytes32", "address", "address", "uint256", "uint256", "uint256"],
								[PERMIT_TYPEHASH, owner, spender, value, nonce, deadline]
							)
						),
					]
				)
			);

			const { v, r, s } = ecsign(Buffer.from(digest.slice(2), "hex"), Buffer.from(account.privateKey.slice(2), "hex"));

			await erpToken.permit(owner, spender, value, deadline, v, hexlify(r), hexlify(s), overrides);
			expect(await erpToken.allowance(owner, spender)).to.eq(value);
			expect(await erpToken.nonces(owner)).to.eq(1);

			await erpToken.connect(wallet1).transferFrom(owner, spender, value, overrides);
		});
	});

	describe(" delegation ", async () => {
		it("nested delegation", async () => {
			await erpToken.transfer(wallet1.address, parseEther("1"));
			await erpToken.transfer(wallet2.address, parseEther("2"));

			let currectVotes0 = await erpToken.getCurrentVotes(wallet1.address);
			let currectVotes1 = await erpToken.getCurrentVotes(wallet2.address);
			expect(currectVotes0).to.be.eq(0);
			expect(currectVotes1).to.be.eq(0);

			await erpToken.connect(wallet1).delegate(wallet2.address);
			currectVotes1 = await erpToken.getCurrentVotes(wallet2.address);
			expect(currectVotes1).to.be.eq(parseEther("1"));

			await erpToken.connect(wallet2).delegate(wallet2.address);
			currectVotes1 = await erpToken.getCurrentVotes(wallet2.address);
			expect(currectVotes1).to.be.eq(parseEther("1").add(parseEther("2")));

			await erpToken.connect(wallet2).delegate(account.address);
			currectVotes1 = await erpToken.getCurrentVotes(wallet2.address);
			expect(currectVotes1).to.be.eq(parseEther("1"));
		});
	});
});
