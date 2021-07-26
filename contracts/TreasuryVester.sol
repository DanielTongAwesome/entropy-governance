// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TreasuryVester {
    using SafeMath for uint;

    address public erp;
    address public recipient;

    uint public vestingAmount;
    uint public vestingBegin;
    uint public vestingCliff;
    uint public vestingEnd;

    uint public lastUpdate;

    constructor(
        address erp_,
        address recipient_,
        uint vestingAmount_,
        uint vestingBegin_,
        uint vestingCliff_,
        uint vestingEnd_
    ) {
        require(erp_ != address(0),                 "TreasuryVester::constructor: rep token zero address");
        require(recipient_ != address(0),           "TreasuryVester::constructor: recipient zero address");
        require(vestingBegin_ >= block.timestamp,   "TreasuryVester::constructor: vesting begin too early");
        require(vestingCliff_ >= vestingBegin_,     "TreasuryVester::constructor: cliff is too early");
        require(vestingEnd_ > vestingCliff_,        "TreasuryVester::constructor: end is too early");

        erp = erp_;
        recipient = recipient_;

        vestingAmount = vestingAmount_;
        vestingBegin = vestingBegin_;
        vestingCliff = vestingCliff_;
        vestingEnd = vestingEnd_;

        lastUpdate = vestingBegin;
    }

    function setRecipient(address recipient_) public {
        require(msg.sender == recipient, "TreasuryVester::setRecipient: unauthorized");
        recipient = recipient_;
    }

    function claim() public {
        require(block.timestamp >= vestingCliff, "TreasuryVester::claim: not time yet");
        uint amount;
        if (block.timestamp >= vestingEnd) {
            amount = IERC20(erp).balanceOf(address(this));
        } else {
            amount = vestingAmount.mul(block.timestamp - lastUpdate).div(vestingEnd - vestingBegin);
            lastUpdate = block.timestamp;
        }
        IERC20(erp).transfer(recipient, amount);
    }
}