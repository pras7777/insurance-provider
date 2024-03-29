// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Wallet.sol";


contract WalletFactory {
    address payable public verifierCompany; 
    address[] public deployedContracts; 
    mapping(address => address) public contractOwners; 
    mapping(address => bool) public hasContract; 

 
    constructor(address payable _verifierCompanyAddress) {
        require(_verifierCompanyAddress != address(0), "Verifier company address cannot be the zero address");
        verifierCompany = _verifierCompanyAddress;
    }


    function createWallet() external {
        require(
            !hasContract[msg.sender],
            "Contract already exists for this address"
        );

        Wallet newWallet = new Wallet(verifierCompany);
        deployedContracts.push(address(newWallet));
        contractOwners[msg.sender] = address(newWallet);
        hasContract[msg.sender] = true;
    }


    function getWalletByOwner(address ownerAddress) external view returns (address) {
        return contractOwners[ownerAddress];
    }

    function getAllDeployedWallets() external view returns (address[] memory) {
        return deployedContracts;
    }
}
