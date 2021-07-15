/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-15 03:32:23
 * @LastEditTime: 2021-07-15 03:32:24
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/test/shared/utils.ts
 */

import { providers, BigNumber } from 'ethers'

export const DELAY = 60 * 60 * 24 * 2

export async function mineBlock(provider: providers.Web3Provider, timestamp: number): Promise<void> {
  return provider.send('evm_mine', [timestamp])
}

export function expandTo18Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}