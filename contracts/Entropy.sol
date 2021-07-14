// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract Entropy is ERC20, ERC20Permit {
    /**
     * @notice Construct a new ERP token
     * @param account The initial account to grant all the tokens
     */
    constructor(address account) ERC20("Entropy", "ERP") ERC20Permit("Entropy") {
        require(account != address(0), "ERPERC20: ACCOUNT ZERO ADDRESS");
        _mint(account, 1000000000 * 10 ** decimals());
    }
}