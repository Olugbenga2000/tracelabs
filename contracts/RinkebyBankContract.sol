// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract RinkebyBankContract {
    address public immutable owner;
    uint immutable timeDeployed;
    uint public rewardPool;
    uint public firstAvailablePool;
    uint public secondAvailablePool;
    uint public thirdAvailablePool;
    uint public immutable interval;
    uint public totalDeposit;
    IERC20 public depositToken = IERC20(0x98d9A611Ad1b5761bdC1dAAc42c48E4d54CF5882);
    mapping(address => uint) public balances;
    
    constructor(uint _interval_In_Mins){
        owner = msg.sender;
        timeDeployed = block.timestamp;
        interval = _interval_In_Mins * 1 minutes;
        
    }
    
    function deposit(uint _amount) external {
        require(block.timestamp < timeDeployed + interval, "User can not deposit again");
        require(_amount > 0, "can not deposit 0 tokens");
        bool success = depositToken.transferFrom(msg.sender, address(this), _amount);
        require(success);
        if(msg.sender == owner){
        rewardPool += _amount;
        firstAvailablePool += (20 * _amount) / 100;
        secondAvailablePool += (30 * _amount) / 100;
        thirdAvailablePool += (50 * _amount) / 100;   
        return;
        }
        balances[msg.sender] += _amount;
        totalDeposit += _amount;
    }
    
    function withdraw() external {
        uint currentTime = block.timestamp;
        uint balance = balances[msg.sender];
        uint timeCreated = timeDeployed;
        require(currentTime >= ( timeCreated +  2 * interval), "you cant withdraw yet");
        require(balance > 0 || msg.sender == owner, "You dont have any balance in the contract");
         uint userFraction;
        if(msg.sender != owner)
        userFraction = (1000 * totalDeposit) / balance;
        else
        require(currentTime >= ( timeCreated +  4 * interval), "Owner can not withdraw");
        uint amountToWithdraw;
        uint totalReward;
        uint firstReward;
        uint secondReward;
        uint thirdReward;
        bool success;
         
        if(currentTime < ( timeCreated + 3 * interval) ){
            firstReward = 1000 * firstAvailablePool / userFraction;
            firstAvailablePool -= firstReward;
            rewardPool -= firstReward;
            amountToWithdraw = balance + firstReward;
            balances[msg.sender] = 0;
            totalDeposit -= balance;
            success = depositToken.transfer(msg.sender, amountToWithdraw);
            require(success);
            
        }
        
        else if(currentTime <  (timeCreated + 4 * interval)) {
            firstReward = 1000 * firstAvailablePool / userFraction;
            secondReward = 1000 * secondAvailablePool / userFraction;
            totalReward = firstReward + secondReward;
            amountToWithdraw = balance + totalReward;
            firstAvailablePool -= firstReward;
            secondAvailablePool -= secondReward;
            rewardPool -= totalReward;
            balances[msg.sender] = 0;
            totalDeposit -= balance;
            success = depositToken.transfer(msg.sender, amountToWithdraw);
            require(success);
        }
        
        else {
            
            if(msg.sender == owner){
                require(totalDeposit == 0 && rewardPool > 0, 'bank owner can not remove money from the bank');
                success = depositToken.transfer(msg.sender, rewardPool);
                require(success);
                firstAvailablePool = 0;
                secondAvailablePool = 0;
                thirdAvailablePool = 0;
                rewardPool = 0;
                return;
            }
            firstReward = 1000 * firstAvailablePool / userFraction;
            secondReward = 1000 * secondAvailablePool / userFraction;
            thirdReward = 1000 * thirdAvailablePool / userFraction;
            totalReward = firstReward + secondReward + thirdReward;
            amountToWithdraw = balance + totalReward;
            firstAvailablePool -= firstReward;
            secondAvailablePool -= secondReward;
            thirdAvailablePool -= thirdReward;
            rewardPool -= totalReward;
            balances[msg.sender] = 0;
            totalDeposit -= balance;
            success = depositToken.transfer(msg.sender, amountToWithdraw);
            require(success);
        }
        
        
    }
    
}