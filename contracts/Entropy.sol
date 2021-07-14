// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Entropy is ERC20 {
    constructor() ERC20("Entropy", "ERP") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }
}