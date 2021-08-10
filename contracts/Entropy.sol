// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract Entropy is ERC20, AccessControl, ERC20Permit {
    using SafeMath for uint;
    
    /// @notice The timestamp after which minting may occur
    uint public mintingAllowedAfter;

    /// @notice Minimum time between mints
    uint public constant minimumTimeBetweenMints = 1 days * 365;

    /// @notice Cap on the percentage of totalSupply that can be minted at each mint
    uint public constant mintCap = 2;
    
    /// @notice define minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice An event thats emitted when the minter address is changed
    event MinterChanged(address minter, address newMinter);

    /**
     * @notice Construct a new ERP token
     * @param account The initial account to grant all the tokens
     * @param minter_ The DAO will make decisions on whether mint tokens after mintingAllowedAfter_
     * @param mintingAllowedAfter_ A time limit for DAO to make decisions on token mint
     */
    constructor(address account, address minter_, uint mintingAllowedAfter_) ERC20("Entropy", "ERP") ERC20Permit("Entropy") {
        require(account != address(0),                  "ERPERC20::constructor: account is zero address");
        require(minter_ != address(0),                  "ERPERC20::constructor: minter_ is zero address");
        require(mintingAllowedAfter_ >= block.timestamp,"ERPERC20::constructor: minting can only begin after deployment");
        _setupRole(DEFAULT_ADMIN_ROLE,  minter_);
        _setupRole(MINTER_ROLE,         minter_);
        mintingAllowedAfter = mintingAllowedAfter_;
        _mint(account, 1000000000 * 10 ** decimals());
    }

    /**
     * @notice only default admin can set new minter
     * @param _newMinter The new minter address
     */
    function approveNewMinter(address _newMinter) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newMinter != address(0), "ERPERC20::setNewMinter: account is zero address");
        grantRole(MINTER_ROLE, _newMinter);
    }

    /**
     * @notice only default admin can revoke a minter
     * @param _minter The preset minter address
     */
    function revokeNewMinter(address _minter) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_minter != address(0), "ERPERC20::setNewMinter: account is zero address");
        revokeRole(MINTER_ROLE, _minter);
    }

    /**
     * @notice only minter can mint new tokens with time and amount limitation
     * @param to       The address of the destination account
     * @param amount    The number of tokens to be minted
     */
    function mint(address to, uint amount) public onlyRole(MINTER_ROLE) {
        require(block.timestamp >= mintingAllowedAfter, "ERPERC20::mint: minting not allowed yet");
        require(to != address(0),                       "ERPERC20::mint: cannot transfer to the zero address");

        // record the mint
        mintingAllowedAfter = block.timestamp.add(minimumTimeBetweenMints);

        // cannot mint more than 2% of total supply
        uint limitAmount = totalSupply().mul(mintCap).div(100);
        require(amount <= limitAmount, "ERPERC20::mint: exceeded mint cap");

        // mint the amount
        _mint(to, amount);
    }
}