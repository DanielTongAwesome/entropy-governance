// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract Entropy is ERC20, ERC20Permit {
    using SafeMath for uint;

    /// @notice Address which may mint new tokens
    address public minter;

    /// @notice The timestamp after which minting may occur
    uint public mintingAllowedAfter;

    /// @notice Minimum time between mints
    uint32 public constant minimumTimeBetweenMints = 1 days * 365;

    /// @notice An event thats emitted when the minter address is changed
    event MinterChanged(address minter, address newMinter);

    /**
     * @notice Construct a new ERP token
     * @param account The initial account to grant all the tokens
     */
    constructor(address account, address minter_, uint mintingAllowedAfter_) ERC20("Entropy", "ERP") ERC20Permit("Entropy") {
        require(account != address(0),                  "ERPERC20::constructor: account is zero address");
        require(mintingAllowedAfter_ >= block.timestamp,"ERPERC20::constructor: minting can only begin after deployment");
        minter = minter_;
        _mint(account, 1000000000 * 10 ** decimals());
    }

    /**
     * @notice Change the minter address
     * @param minter_ The address of the new minter
     */
    function setMinter(address minter_) external {
        require(msg.sender == minter, "ERPERC20::setMinter: only the minter can change the minter address");
        emit MinterChanged(minter, minter_);
        minter = minter_;
    }

    /**
     * @notice Mint new tokens
     * @param dst       The address of the destination account
     * @param amount    The number of tokens to be minted
     */
    function mint(address dst, uint amount) external {
        require(msg.sender == minter,                   "ERPERC20::mint: only the minter can mint");
        require(block.timestamp >= mintingAllowedAfter, "ERPERC20::mint: minting not allowed yet");
        require(dst != address(0),                      "ERPERC20::mint: cannot transfer to the zero address");

        // record the mint
        mintingAllowedAfter = block.timestamp.add(minimumTimeBetweenMints);

        // mint the amount
        _mint(dst, amount ** decimals());
    }
}