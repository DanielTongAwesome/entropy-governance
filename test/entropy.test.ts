/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 00:35:06
 * @LastEditTime: 2021-07-15 00:50:51
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: unit test for entropy token
 * @FilePath: /entropy-governance/test/entropy.test.ts
 */

import { expect, use } from "chai";
import { solidity, MockProvider, createFixtureLoader, deployContract } from "ethereum-waffle";
import { BigNumber, Contract } from "ethers";
import { formatBytes32String, parseEther, toUtf8Bytes } from "ethers/lib/utils";
import { v2Fixture } from './shared/fixtures';

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
    })

});