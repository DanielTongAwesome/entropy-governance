// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract Entropy is ERC20, ERC20Permit {
    constructor() ERC20("Entropy", "ERP") ERC20Permit("Entropy") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }
}