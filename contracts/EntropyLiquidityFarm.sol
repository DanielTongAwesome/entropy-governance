// SPDX-License-Identifier: GPL 3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Entropy.sol";

contract EntropyLiquidityFarm is Ownable {
    using SafeMath for uint;

    ///@notice Info of each user
    struct UserInfo {
        uint amount;        // Hpw many lp token the user has provided
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

    ///@dev Address of Entropy Token
    IERC20 public immutable ENTROPY;
    // Block number when bonus ENTROPY period ends
    uint public bonusEndBlock;
    // Entropy token created per block
    uint public entropyPerBlock;
    // Bonus multiplier for early Entropy makers
    uint public constant BONUS_MULTIPLIER = 10;
    ///@dev Extra decimals for pool's accEntropyPerShare attribute. Needed in order to accomodate different types of LPs.
    uint private constant ACC_ENTROPY_PRECISION = 1e12;
    
    ///@notice Address of the LP token for each liquidity farm pool
    IERC20[] public lpToken;
    // Info of each pool
    PoolInfo[] public poolInfo;
    ///@notice Info of each user that stakes LP tokens
    mapping(uint => mapping(address => UserInfo)) public userInfo;
    ///@dev Info of lp token already in pool or not
    mapping(address => bool) private isTokenInPool;

    ///@notice Total allocation points. Must be the sum of all allocation points in all pools
    uint public totalAllocPoint = 0;
    ///@notice The block number when Entropy mining starts
    uint public startBlock;

    event Deposit   (address indexed user, uint indexed pid, uint amount, address indexed to);
    event Withdraw  (address indexed user, uint indexed pid, uint amount, address indexed to);
    event Harvest   (address indexed user, uint indexed pid, uint entropyAmount, address indexed to);
    event EmergencyWithdraw (address indexed user, uint indexed pid, uint amount, address indexed to);
    event LogPoolAddition   (uint indexed pid, uint allocPoint, IERC20 indexed lpToken);
    event LogSetPool        (uint indexed pid, uint allocPoint);
    event LogUpdatePool     (uint indexed pid, uint lastRewardBlock, uint lpSupply, uint accEntropyPerShare);
    event SetEntropyPerBlock(uint entropyPerBlock);

    ///@param _entropy          The Entropy token contract address
    ///@param _entropyPerBlock  Entropy token assigned to transfer per block
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
    function poolLength () external view returns (uint pools) {
        pools = poolInfo.length;
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
    function getLPSupply (uint _pid) external view returns (uint) {
        uint lpSupply = lpToken[_pid].balanceOf(address(this));
        return lpSupply;
    }

    ///@notice Add a new lp token to the pool. Can only be called by owner.
    ///@param _allocPoint   AP of the new pool
    ///@param _lpToken      Address of lp token
    function add (uint _allocPoint, IERC20 _lpToken) public onlyOwner {
        require(address(_lpToken) != address(0),           "LPFARM: INPUT ZERO TOKEN ADDRESS");
        require(isTokenInPool[address(_lpToken)] == false, "LPFARM: TOKEN ALREADY IN POOL");
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        lpToken.push(_lpToken);
        isTokenInPool[address(_lpToken)] = true;

        poolInfo.push(PoolInfo({
            allocPoint:         _allocPoint,
            lastRewardBlock:    block.number,
            accEntropyPerShare: 0
        }));

        emit LogPoolAddition(lpToken.length.sub(1), _allocPoint, _lpToken);
    }

    ///@notice  Update the given pool's ENTROPY allocation point. Can only be called by the owner
    ///@param _pid          The index of the pool. See 'poolInfo'
    ///@param _allocPoint   New AP of the pool
    function set (uint _pid, uint _allocPoint) external onlyOwner {
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
        uint lpSupply = lpToken[_pid].balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply > 0 && totalAllocPoint > 0) {
            uint multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint entropyReward = multiplier.mul(entropyPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accEntropyPerShare = accEntropyPerShare.add(entropyReward.mul(ACC_ENTROPY_PRECISION).div(lpSupply));
        }
        pending = user.amount.mul(accEntropyPerShare).div(ACC_ENTROPY_PRECISION).sub(user.rewardDebt);
    }

    ///@notice Update reward vairables for all pools. Be careful of gas spending!
    function massUpdateAllPools () public {
        uint len = poolInfo.length;
        for (uint pid = 0; pid < len; ++pid) {
            updatePool(pid);
        }
    }

    ///@notice Update reward variables of the given pool to be up-to-date.
    ///@param _pid  The index of the pool
    function updatePool (uint _pid) public returns (PoolInfo memory pool) {
        pool = poolInfo[_pid];
        if (block.number > pool.lastRewardBlock) {
            uint lpSupply = lpToken[_pid].balanceOf(address(this));
            if (lpSupply > 0 && totalAllocPoint > 0) {
                uint multiplier = getMultiplier(pool.lastRewardBlock, block.number);
                uint entropyReward = multiplier.mul(entropyPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
                pool.accEntropyPerShare = pool.accEntropyPerShare.add(entropyReward.mul(ACC_ENTROPY_PRECISION).div(lpSupply));
            }
            pool.lastRewardBlock = block.number;
            poolInfo[_pid] = pool;

            emit LogUpdatePool(_pid, pool.lastRewardBlock, lpSupply, pool.accEntropyPerShare);
        }
    }

    ///@notice Deposit sponsor token to Farm contract for Entropy allocation
    ///@param _pid      The index of the pool
    ///@param _amount   The total amount of lp token
    ///@param _to       The address if the recipient
    function deposit (uint _pid, uint _amount, address _to) external {
        require(_to != address(0), "SPFARM: INPUT ZERO TOKEN ADDRESS");
        PoolInfo memory  pool = updatePool(_pid);
        UserInfo storage user = userInfo[_pid][_to];

        // Update user info
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.rewardDebt.add(_amount.mul(pool.accEntropyPerShare).div(ACC_ENTROPY_PRECISION));

        // Transfer lp token to contract
        lpToken[_pid].transferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _pid, _amount, _to);
    }

    ///@notice Withdraw sponsor token from Entropy Farm
    ///@param _pid      The index of the pool
    ///@param _amount   The amount of lp token
    ///@param _to       The address of recipient
    function withdraw (uint _pid, uint _amount, address _to) external {
        require(_to != address(0),      "LPFARM: INPUT ZERO TOKEN ADDRESS");
        PoolInfo memory  pool = updatePool(_pid);
        UserInfo storage user = userInfo[_pid][_to];
        require(_amount <= user.amount, "LPFARM: NOT ENOUGH BALANCE");

         // Update user info
        user.rewardDebt = user.rewardDebt.sub(_amount.mul(pool.accEntropyPerShare).div(ACC_ENTROPY_PRECISION));
        user.amount = user.amount.sub(_amount);

        // Transfer lp token to address _to
        lpToken[_pid].transfer(_to, _amount);

        emit Withdraw(msg.sender, _pid, _amount, _to);
    }

    ///@notice Harvest the reward entropy token
    ///@param _pid  The index of the pool
    ///@param _to   The address of the recipient
    function harvest (uint _pid, address _to) external {
        require(_to != address(0), "LPFARM: INPUT ZERO TOKEN ADDRESS");
        PoolInfo memory  pool = updatePool(_pid);
        UserInfo storage user = userInfo[_pid][_to];

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
        require(_to != address(0), "LPFARM: INPUT ZERO TOKEN ADDRESS");
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint amount = user.amount;

        user.amount = 0;
        user.rewardDebt = 0;

        lpToken[_pid].transfer(_to, amount);
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