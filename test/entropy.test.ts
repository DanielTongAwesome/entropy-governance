/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 00:35:06
 * @LastEditTime: 2021-07-15 03:29:43
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: unit test for entropy token
 * @FilePath: /entropy-governance/test/entropy.test.ts
 */

import { expect, use } from "chai";
import { solidity, MockProvider, createFixtureLoader, deployContract } from "ethereum-waffle";
import { BigNumber, Contract } from "ethers";
import { formatBytes32String, parseEther, toUtf8Bytes } from "ethers/lib/utils";
import { ERC20, IERC20__factory } from "../types";
import { v2Fixture } from './shared/fixtures';

require("dotenv").config({ path: require("find-config")("../.env") });

use(solidity)
const overrides = {
    gasLimit: 999999999999999
}

describe("Entropy ERC20 Test", () => {
    const provider = new MockProvider({
    ganacheOptions: {
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 999999999999999
    }
    })

    const [wallet1, wallet2, wallet3] = provider.getWallets();
    const loadFixture = createFixtureLoader([wallet1, wallet2, wallet3], provider);
    
    const ACCOUNT = process.env.ACCOUNT;
    const MINTER = process.env.MINTER;
    const MINTINGALLOWEDAFTER = process.env.MINTINGALLOWEDAFTER;

    let ERPERC20: Contract;

    beforeEach(async () => {
        const fixture = await loadFixture(v2Fixture);
        ERPERC20 = fixture.ERPToken;
    })

    describe("Deploy ERP ERC20 Token Smart Contract", async () => {
        it("should have correct token name", async () => {
            expect(await ERPERC20.name()).to.be.eq("Entropy");
        })
        it("should have correct token symbol", async () => {
            expect(await ERPERC20.symbol()).to.be.eq("ERP");
        })

        it("should have correct token decimals", async () => {
            expect(await ERPERC20.decimals()).to.be.eq(18);
        })

        it("should have correct token total supply", async () => {
        expect(await ERPERC20.totalSupply()).to.be.eq(parseEther('1000000000'));
        })

        it("should have correct minter", async () => {
            expect(await ERPERC20.minter()).to.be.eq(MINTER);
        })
        
        it("should have correct account", async () => {
            expect(await ERPERC20.mintingAllowedAfter()).to.be.eq(MINTINGALLOWEDAFTER);
        })

        it("should create 1B token to account", async () => {
            expect(await ERPERC20.balanceOf(ACCOUNT)).to.be.eq(parseEther('1000000000'));
        })
    })

    describe("setMinter function test", async () => {
        it("should only allow preset minter to change the minter", async () => {
            await expect(ERPERC20.setMinter(wallet2.address)).to.be.revertedWith("ERPERC20::setMinter: only the minter can change the minter address");
        })
    })

});