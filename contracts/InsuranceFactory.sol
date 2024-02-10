// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Insurance.sol";

contract InsuranceFactory {
    address[] public deployedContracts; 
    address payable public verifierCompany; 
    mapping(address => address) public insuranceContractOwners;
    mapping(address => bool) public hasContract; 

 
    constructor(address payable _verifierCompany) {
        verifierCompany = _verifierCompany;
    }

  
    function createInsurance() external {
        require(
            !hasContract[msg.sender],
            "Contract already exists for this address"
        );

        Insurance newInsuranceContract = new Insurance(verifierCompany);
        deployedContracts.push(address(newInsuranceContract)); 
        insuranceContractOwners[msg.sender] = address(newInsuranceContract); 
        hasContract[msg.sender] = true; 
    }

  
    function getInsuranceContractByOwner(address ownerAddress) external view returns (address) {
        return insuranceContractOwners[ownerAddress];
    }


    function getDeployedInsuranceContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
}
