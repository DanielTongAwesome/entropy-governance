export const chainName = (chainId:number) => {
    switch (chainId) {
        case 1: return "Mainnet";
        case 3: return "Ropsten";
        case 4: return "Rinkeby";
        case 5: return "Goerli";
        case 42: return "Kovan";
        case 56: return "Binance Smart Chain";
        case 77: return "POA Sokol";
        case 97: return "Binance Smart Chain (testnet)";
        case 99: return "POA";
        case 100: return "xDai";
        case 137: return "Matic";
        case 31337: return "HardhatEVM";
        case 80001: return "Matic (Mumbai)";
        default: return "Unknown";
    }
}