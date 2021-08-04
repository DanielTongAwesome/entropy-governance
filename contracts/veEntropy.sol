// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract veEntropy is ERC20, ERC20Burnable, AccessControl, ERC20Votes {

    /// @notice define minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    /// @notice define burner role
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice An event thats emitted when vote vester contract been setted
    event SetVoteVesterContract (address indexed proposer, address indexed vester);

    /**
     * @notice Construct veERP token for vote and revenue share
     * @param voteVester_ The vote vesting contract address that can control mint and burn of veERP
     */
    constructor(address voteVester_) ERC20("veEntropy", "veERP") ERC20Permit("veEntropy") {
        require(voteVester_ != address(0), "veERP: VESTING CONTRACT ZERO ADDRESS");
        _setupRole(MINTER_ROLE, voteVester_);
        _setupRole(BURNER_ROLE, voteVester_);
        emit SetVoteVesterContract(msg.sender, voteVester_);
    }

    /**
     * @notice Transfer should be rejected, veERP is non-transferable
     * @param recipient The transfer token recipient
     * @param amount    The amount input by sender
     */
    function transfer(address recipient, uint256 amount) 
        public
        pure
        override(ERC20) returns (bool)
    {
        revert("veERPERC20::transfer: veToken is non-transferable");
    }

    /**
     * @notice Transfer should be rejected, veERP is non-transferable
     * @param sender    The token transfer request sender
     * @param recipient The token transfer recipient
     * @param amount    The amount input by sender
     */
    function transferFrom(address sender, address recipient, uint256 amount) 
        public
        pure
        override(ERC20) returns (bool)
    {
        revert("veERPERC20::transferFrom: veToken is non-transferable");
    }

    /**
     * @notice only voteVester can mint tokens
     * @param to     The recipient of the mint process
     * @param amount The amount of token input by minter
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice only voteVester can burn tokens
     * @param account The address of the wallet
     * @param amount  The amount of token input by minter
     */
    function burn(address account, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(account, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}