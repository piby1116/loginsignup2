// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Fundraiser {
    address public owner;
    string public name;
    uint256 public targetAmount;
    uint256 public finishTime;
    string public description;
    uint256 public totalDonations;
    mapping(address => uint256) public donations;

    constructor(string memory _name, uint256 _targetAmount, uint256 _finishTime, string memory _description) {
        owner = msg.sender;
        name = _name;
        targetAmount = _targetAmount;
        finishTime = _finishTime;
        description = _description;
        totalDonations = 0;
    }

    function donate() public payable {
        require(block.timestamp < finishTime, "Fundraising has ended");
        require(msg.value > 0, "Donation must be greater than 0");
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;
    }

    function getDetails() public view returns (address, string memory, uint256, uint256, uint256, string memory) {
        return (owner, name, targetAmount, totalDonations, finishTime, description);
    }
}





