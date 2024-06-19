// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Fundraiser.sol";

contract FundraiserFactory {
    mapping(address => address[]) private _fundraisers;
    event FundraiserCreated(address indexed newFundraiser);

    function createFundraiser(string calldata name, uint256 targetAmount, uint256 finishTime, string calldata description) public {
        Fundraiser newFundraiser = new Fundraiser(name, targetAmount, finishTime, description);
        _fundraisers[msg.sender].push(address(newFundraiser));
        emit FundraiserCreated(address(newFundraiser));
    }

    function getMyFundraisers() public view returns (address[] memory) {
        return _fundraisers[msg.sender];
    }
}
