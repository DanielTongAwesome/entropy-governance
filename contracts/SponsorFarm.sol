// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Entropy.sol";

contract SponsorFarm is Ownable {
    using SafeMath for uint;
    
    ///@notice Info of each user
    struct UserInfo {
        uint amount;        // Hpw many sponsor token the user has provided
        uint rewardDebt;    // Reward debt. See explaination below:
    }
    // How to calculate user pending harvest reward:
    //
    //   pending reward = (user.amount * pool.accSushiPerShare) - user.rewardDebt
    //
    // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
    //   1. The pool's `accSushiPerShare` (and `lastRewardBlock`) gets updated.
    //   2. User receives the pending reward sent to his/her address.
    //   3. User's `amount` gets updated.
    //   4. User's `rewardDebt` gets updated.

    ///@notice Info of each pool
    struct PoolInfo {
        IERC20 sponsorToken;        // sponsor token 
        uint accEntropyPerShare;    // Accumulated Entropy per share
        uint lastRewardBlock;       // Last block number that Entropy distrbution occurs
        uint allocPoint;            // Entropy token allocation point
    }

    /// @notice ENTROPY contract address
    IERC20 public immutable entropy;
    // Block number when bonus ENTROPY period ends
    uint public bonusEndBlock;
    // Entropy token created per block
    uint public entropyPerBlock;
    // Bonus multiplier for early Entropy makers
    uint public constant BONUS_MULTIPLIER = 10;
    // Info of each pool
    PoolInfo[] public poolInfo;
    // Info of each user that stakes sponsor tokens
    mapping(uint => mapping(address => UserInfo)) public userInfo;
    // Info of sponsor token already in pool or not
    mapping(address => bool) public isTokenInPool;
    // Total allocation points. must be the sum of all allocation points in all pools
    uint public totalAllocPoint = 0;
    // The block number when Entropy mining starts
    uint public startBlock;
    
    event Deposit   (address indexed user, uint indexed pid, uint amount);
    event Withdraw  (address indexed user, uint indexed pid, uint amount);
    event Harvest   (address indexed user, uint indexed pid, uint amount);
    event EmergencyWithdraw (
        address indexed user,
        uint indexed pid,
        uint amount
    );


    constructor (
        Entropy _entropy,
        uint _entropyPerBlock,
        uint _startBlock,
        uint _bonusEndBlock
    ) {
        entropy = _entropy;
        entropyPerBlock = _entropyPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _bonusEndBlock;
    }

    function poolLength() external view returns (uint) {
        return poolInfo.length;
    }

    ///@notice Add a new sponsor token to the pool. Can only be called by owner.
    function add (
        uint _allocPoint,
        address _sponsorToken,
        bool _withUpdate
    ) public onlyOwner {
        require(isTokenInPool[_sponsorToken] == false, "FARM: TOKEN ALREADY IN POOL");
        isTokenInPool[_sponsorToken] = true;
        IERC20 sponsorERC20 = IERC20(_sponsorToken);

        if  (_withUpdate) {
            massUpdatePools();
        }

        uint lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                sponsorToken:       sponsorERC20,
                allocPoint:         _allocPoint,
                lastRewardBlock:    lastRewardBlock,
                accEntropyPerShare: 0
            })
        );
    }

    // Update the given pool's ENTROPY allocation point. Can only be called by the owner
    function set (
        uint _pid,
        uint _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if  (_withUpdate) {
            massUpdatePools();
        }

        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // Return reward multiplier over the given _from to _to block.  
    function getMultiplier(
        uint _from, 
        uint _to
    ) public view returns (uint) {
        if (_to <= bonusEndBlock) {
            // range in bonus period
            return _to.sub(_from).mul(BONUS_MULTIPLIER);
        } else if (_from >= bonusEndBlock) {
            // range not in bonus period
            return _to.sub(_from);
        } else {
            // range partially in bonus period
            return
                bonusEndBlock.sub(_from).mul(BONUS_MULTIPLIER).add(
                    _to.sub(bonusEndBlock)
                );
        }
    }

     // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint length = poolInfo.length;
        for (uint pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint _pid) public {
        PoolInfo storage pool = poolInfo[_pid];

        if (block.number <= pool.lastRewardBlock) {
            return;
        }

        uint sponsorSupply = pool.sponsorToken.balanceOf(address(this));
        if (sponsorSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint entropyReward = multiplier.mul(entropyPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        pool.accEntropyPerShare = pool.accEntropyPerShare.add(entropyReward.mul(1e12).div(sponsorSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit sponsor token to Farm contract for Entropy allocation
    function deposit (
        uint _pid,
        uint _amount
    ) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);

        if (user.amount > 0) {
            uint pending = user.amount.mul(pool.accEntropyPerShare).div(1e12).sub(user.rewardDebt);
            entropy.transfer(msg.sender, pending);
        }

        pool.sponsorToken.transferFrom(address(msg.sender), address(this), _amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accEntropyPerShare).div(1e12);
        
        emit Deposit(msg.sender, _pid, _amount); 
    }
    
    function withdraw (
        uint _pid,
        uint _amount
    ) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);

        uint pending = user.amount.mul(pool.accEntropyPerShare).div(1e12).sub(user.rewardDebt);
        user.rewardDebt = user.amount.mul(pool.accEntropyPerShare).div(1e12);
        user.amount = user.amount.sub(_amount);
        safeEntropyTransfer(msg.sender, pending);
        
        pool.sponsorToken.transfer(address(msg.sender), _amount);

        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw (uint _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint userAmount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        
        pool.sponsorToken.transfer(address(msg.sender), userAmount);
        
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
    }

    // harvest the reward entropy token
    function harvest (uint _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);

        uint pending = user.amount.mul(pool.accEntropyPerShare).div(1e12).sub(user.rewardDebt);
        user.rewardDebt = pending;
        safeEntropyTransfer(msg.sender, pending);

        emit Harvest(msg.sender, _pid, pending);
    } 

    // Safe entropy token transfer function, just in case if rounding error causes pool to not have enough entropy tokens.
    function safeEntropyTransfer(address _to, uint _amount) internal {
        uint entropyLevel = entropy.balanceOf(address(this));
        if (_amount > entropyLevel) {
            entropy.transfer(_to, entropyLevel);
        } else {
            entropy.transfer(_to, _amount);
        }
    }
}