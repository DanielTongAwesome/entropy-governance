// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Entropy.sol";

contract EntropySponsorFarm is Ownable {
    using SafeMath for uint;
    
    ///@notice Info of each user
    struct UserInfo {
        uint amount;        // Hpw many sponsor token the user has provided
        uint rewardDebt;    // Reward debt. See explaination below:
    }
    // How to calculate user pending harvest reward:
    //
    //   pending reward = (user.amount * pool.accEntropyPerShare) - user.rewardDebt
    //
    // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
    //   1. The pool's `accEntropyPerShare` (and `lastRewardBlock`) gets updated.
    //   2. User receives the pending reward sent to his/her address.
    //   3. User's `amount` gets updated.
    //   4. User's `rewardDebt` gets updated.

    ///@notice Info of each pool
    struct PoolInfo {
        uint accEntropyPerShare;    // Accumulated Entropy per share
        uint lastRewardBlock;       // Last block number that Entropy distrbution occurs
        uint allocPoint;            // Entropy token allocation point
    }

    /// @notice ENTROPY contract address
    IERC20 public immutable ENTROPY;
    // Block number when bonus ENTROPY period ends
    uint public bonusEndBlock;
    // Entropy token created per block
    uint public entropyPerBlock;
    // Bonus multiplier for early Entropy makers
    uint public constant BONUS_MULTIPLIER = 10;
    // Constant for calculation precision
    uint private constant ACC_ENTROPY_PRECISION = 1e18;

    ///@notice Address of the sponsor token for each sponsor farm pool
    IERC20[] public sponsorToken;
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
    event Withdraw  (address indexed user, uint indexed pid, uint amount, address indexed to);
    event Harvest   (address indexed user, uint indexed pid, uint entropyAmount, address indexed to);
    event EmergencyWithdraw (address indexed user, uint indexed pid, uint amount, address indexed to);
    event LogPoolAddition   (uint indexed pid, uint allocPoint, IERC20 indexed sponsorToken);
    event LogSetPool        (uint indexed pid, uint allocPoint);
    event LogUpdatePool     (uint indexed pid, uint lastRewardBlock, uint sponsorSupply, uint accEntropyPerShare);
    event SetEntropyPerBlock(uint entropyPerBlock);

    ///@param _entropy          Entropy token
    ///@param _entropyPerBlock  The amount of entropy token per block
    ///@param _startBlock       Starting block of farming
    ///@param _bonusEndBlock    Ending block of farming
    constructor (
        IERC20 _entropy,
        uint _entropyPerBlock,
        uint _startBlock,
        uint _bonusEndBlock
    ) {
        ENTROPY = _entropy;
        entropyPerBlock = _entropyPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _bonusEndBlock;
        emit SetEntropyPerBlock(_entropyPerBlock);
    }

    ///@notice Returns the number of pools
    function poolLength () external view returns (uint) {
        return poolInfo.length;
    }

    ///@notice Returns the Entropy value for a specific pool
    ///@param _pid  The index of the pool
    function poolEntropyReward (uint _pid) external view returns (uint) {
        if (totalAllocPoint == 0) {
            return 0;
        }
        return entropyPerBlock.mul(poolInfo[_pid].allocPoint).div(totalAllocPoint);
    }

    ///@notice Returns the total number of LPs staked in the farms.
    ///@param _pid  The index of the pool
    function getSponsorSupply (uint _pid) external view returns (uint) {
        uint sponsorSupply = sponsorToken[_pid].balanceOf(address(this));
        return sponsorSupply;
    }

    ///@notice Add a new sponsor token to the pool. Can only be called by owner.
    ///@param _allocPoint   AP of the new pool
    ///@param _sponsorToken Address of sponsor ERC-20 token
    function add (uint _allocPoint, IERC20 _sponsorToken) public onlyOwner {
        require(address(_sponsorToken) != address(0),           "SPFARM: INPUT ZERO TOKEN ADDRESS");
        require(isTokenInPool[address(_sponsorToken)] == false, "SPFARM: TOKEN ALREADY IN POOL");
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        sponsorToken.push(_sponsorToken);
        isTokenInPool[address(_sponsorToken)] = true;

        poolInfo.push(PoolInfo({
            allocPoint:         _allocPoint,
            lastRewardBlock:    block.number,
            accEntropyPerShare: 0
        }));

        emit LogPoolAddition(sponsorToken.length.sub(1), _allocPoint, _sponsorToken);
    }

    ///@notice  Update the given pool's ENTROPY allocation point. Can only be called by the owner
    ///@param _pid          The index of the pool. See 'poolInfo'
    ///@param _allocPoint   New AP of the pool
    function set (uint _pid, uint _allocPoint) public onlyOwner {
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        emit LogSetPool(_pid, _allocPoint);
    }
    
    ///@notice Return reward multiplier over the given _from to _to block.
    ///@param _from The starting block number
    ///@param _to   The ending block number
    function getMultiplier (
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

     /// @notice View function to see pending ENTROPY on frontend.
    /// @param _pid     The index of the pool. See `poolInfo`.
    /// @param _user    Address of user.
    /// @return pending SUSHI reward for a given user.
    function pendingEntropy (uint _pid, address _user) external view returns (uint pending) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo memory user = userInfo[_pid][_user];

        uint accEntropyPerShare = pool.accEntropyPerShare;
        uint sponsorSupply = sponsorToken[_pid].balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && sponsorSupply > 0 && totalAllocPoint > 0) {
            uint multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint entropyReward = multiplier.mul(entropyPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accEntropyPerShare = accEntropyPerShare.add(entropyReward.mul(ACC_ENTROPY_PRECISION).div(sponsorSupply));
        }
        pending = user.amount.mul(accEntropyPerShare).div(ACC_ENTROPY_PRECISION).sub(user.rewardDebt);
    }

     ///@notice Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools () public {
        uint length = poolInfo.length;
        for (uint pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    ///@notice Update reward variables of the given pool to be up-to-date.
    ///@param _pid  The index of the pool
    function updatePool (uint _pid) public returns (PoolInfo memory pool) {
        pool = poolInfo[_pid];
        if (block.number > pool.lastRewardBlock) {
            uint sponsorSupply = sponsorToken[_pid].balanceOf(address(this));
            if (sponsorSupply > 0 && totalAllocPoint > 0) {
                uint multiplier = getMultiplier(pool.lastRewardBlock, block.number);
                uint entropyReward = multiplier.mul(entropyPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
                pool.accEntropyPerShare = pool.accEntropyPerShare.add(entropyReward.mul(ACC_ENTROPY_PRECISION).div(sponsorSupply));
            }
            pool.lastRewardBlock = block.number;
            poolInfo[_pid] = pool;

            emit LogUpdatePool(_pid, pool.lastRewardBlock, sponsorSupply, pool.accEntropyPerShare);
        }
    }

    ///@notice Deposit sponsor token to Farm contract for Entropy allocation
    ///@param _pid      The index of the pool
    ///@param _amount   The total amount of sponsor token
    function deposit (uint _pid, uint _amount) public {
        PoolInfo memory  pool = updatePool(_pid);
        UserInfo storage user = userInfo[_pid][msg.sender];

        // transfer sponsor token to contract
        sponsorToken[_pid].transferFrom(msg.sender, address(this), _amount);

        // Update user info
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.rewardDebt.add(_amount.mul(pool.accEntropyPerShare).div(ACC_ENTROPY_PRECISION));

        emit Deposit(msg.sender, _pid, _amount);
    }
    
    ///@notice Withdraw sponsor token from Entropy Farm
    ///@param _pid      The index of the pool
    ///@param _amount   The amount of sponsor token
    ///@param _to       The address of recipient
    function withdraw (uint _pid, uint _amount, address _to) public {
        require(_to != address(0),      "SPFARM: INPUT ZERO TOKEN ADDRESS");
        PoolInfo memory  pool = updatePool(_pid);
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(_amount <= user.amount, "SPFARM: NOT ENOUGH BALANCE");

        // Update user info
        user.rewardDebt = user.rewardDebt.sub(_amount.mul(pool.accEntropyPerShare).div(ACC_ENTROPY_PRECISION));
        user.amount = user.amount.sub(_amount);

        // Transfer sponsor token to address _to
        sponsorToken[_pid].transfer(_to, _amount);

        emit Withdraw(msg.sender, _pid, _amount, _to);
    }

    ///@notice Harvest the reward entropy token
    ///@param _pid  The index of the pool
    ///@param _to   The address of the recipient
    function harvest (uint _pid, address _to) public {
        require(_to != address(0), "SPFARM: INPUT ZERO TOKEN ADDRESS");
        PoolInfo memory  pool = updatePool(_pid);
        UserInfo storage user = userInfo[_pid][msg.sender];

        uint accumulatedEntropy = user.amount.mul(pool.accEntropyPerShare).div(ACC_ENTROPY_PRECISION);
        uint _pendingEntropy = accumulatedEntropy.sub(user.rewardDebt);
        
        // Update user reward debt
        user.rewardDebt = accumulatedEntropy;

        // Send reward back to user
        if (_pendingEntropy > 0) {
            safeEntropyTransfer(_to, _pendingEntropy);
        }

        emit Harvest(msg.sender, _pid, _pendingEntropy, _to);
    } 

    ///@notice Withdraw without caring about rewards. EMERGENCY ONLY.
    ///@param _pid  The index of the pool
    ///@param _to   The address of the recipient
    function emergencyWithdraw (uint _pid, address _to) public {
        require(_to != address(0), "SPFARM: INPUT ZERO TOKEN ADDRESS");
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint amount = user.amount;
        
        user.amount = 0;
        user.rewardDebt = 0;
        
        sponsorToken[_pid].transfer(_to, amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount, _to);
    }

    ///@notice Safe entropy token transfer function, just in case if rounding error causes pool to not have enough entropy tokens
    ///@param _to       recipient
    ///@param _amount   amount of entropy token
    function safeEntropyTransfer(address _to, uint _amount) internal {
        uint entropyLevel = ENTROPY.balanceOf(address(this));
        if (_amount > entropyLevel) {
            ENTROPY.transfer(_to, entropyLevel);
        } else {
            ENTROPY.transfer(_to, _amount);
        }
    }
}