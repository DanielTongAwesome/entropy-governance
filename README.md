<!--
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 00:31:57
 * @LastEditTime: 2021-07-13 22:54:25
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/README.md
-->
<a href="https://www.entropyfi.com" target="_blank">
    <img alt="entropyfi" src="https://raw.githubusercontent.com/entropyfi/entropy-resource/master/Entropyfi.svg" width="120px" height=:"120px" align="left">
</a>

<div align="left">

# 「 Entropyfi -  Governance Token 」

**_<a href="https://www.entropyfi.com/">WWW.ENTROPYFI.COM</a>_** / ⚡️ Amplify Yield and Insure Assets with Entropyfi

</div>


### Project setup
1. install all packages

   ```shell
   ❯ yarn install
   ```

2. create your own .env file, check out the sample [.env_sample](.env_sample)

   ```shell
   ❯ touch .env
   ```

3. to deploy a contract with many dependent files
   - flattern the .sol file by using
   ```shell
   ❯ truffle-flattener <solidity-files>
   ```
   - modify [deploy contract](./migrations/2_deploy_contracts.js)
   - Note: use [abi.hashEX](https://abi.hashex.org/#) to generate ABI-encoded output
   - deploy command
   ```shell
   ❯ npx hardhat run --network kovan ./scripts/deploy.ts
   ```
   - verify contract command
   ```shell
   ❯ npx hardhat verify --network kovan  CONTRACT_ADDRESS  "INPUT1" "INPUT2" ...
   ```

### Unit Tests
> [hardhat](https://hardhat.org/) (with [ethers.js](https://github.com/ethers-io/ethers.js/)) is used for testing.

1. make sure you have compiled our contracts. The build files should locate under folder `artifacts`
   ```shell
   ❯ yarn compile
   ```
2. run **unit test**
   ```shell
   ❯ yarn test
   ```
