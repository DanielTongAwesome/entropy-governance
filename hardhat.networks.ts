/*
 * @Author: Zitian(Daniel) Tong
 * @Date: 2021-07-13 22:26:12
 * @LastEditTime: 2021-07-13 22:26:24
 * @LastEditors: Zitian(Daniel) Tong
 * @Description: 
 * @FilePath: /entropy-governance/hardhat.networks.ts
 */
import { NetworksUserConfig } from 'hardhat/types';

require('dotenv').config({ path: require('find-config')('./.env') });

export const networks: NetworksUserConfig = {
    coverage: {
        url: 'http://127.0.0.1:8555',
        chainId: 1, // tbd
        blockGasLimit: 200000000,
        allowUnlimitedContractSize: true
    },
    localhost: {
        chainId: 1,
        url: 'http://127.0.0.1:8545',
        allowUnlimitedContractSize: true
    },

    ropsten: {
        // chainId:3,
        url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
        accounts: {
            mnemonic:process.env.MNEMONIC
        },
        allowUnlimitedContractSize: true
    },

    kovan: {
        chainId: 42,
        url: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
        blockGasLimit: 200000000,
        accounts: {
            mnemonic:process.env.MNEMONIC
        }
    },

    rinkeby: {
        // chainId:
        url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
        blockGasLimit: 200000000,
        accounts: {
            mnemonic:process.env.MNEMONIC
        }
    }


}