// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Insurance.sol";

/**
 * @title InsuranceFactory
 * @dev This contract serves as a factory for creating instances of the Insurance contract.
 *      It keeps track of all deployed Insurance contracts and their associated owners.
 */
contract InsuranceFactory {
    address[] public deployedContracts; // Stores the addresses of all deployed Insurance contracts
    address payable public verifierCompany; // Address of the verifier company
    mapping(address => address) public insuranceContractOwners; // Maps user addresses to their corresponding Insurance contract addresses
    mapping(address => bool) public hasContract; // Tracks whether a user has deployed an Insurance contract

    /**
     * @dev Sets the address of the verifier company upon contract deployment.
     * @param _verifierCompany The address of the verifier company (admin).
     */
    constructor(address payable _verifierCompany) {
        verifierCompany = _verifierCompany;
    }

    /**
     * @notice Creates a new instance of the Insurance contract for the caller.
     */
    function createInsurance() external {
        require(
            !hasContract[msg.sender],
            "Contract already exists for this address"
        );

        Insurance newInsuranceContract = new Insurance(verifierCompany); // Deploy a new instance
        deployedContracts.push(address(newInsuranceContract)); // Store the address of the deployed contract
        insuranceContractOwners[msg.sender] = address(newInsuranceContract); // Map the caller's address to the contract
        hasContract[msg.sender] = true; // Update contract deployment status for the caller
    }

    /**
     * @notice Retrieves the Insurance contract address associated with a specific owner.
     * @param ownerAddress The wallet address of the owner.
     * @return The address of the associated Insurance contract.
     */
    function getInsuranceContractByOwner(address ownerAddress) external view returns (address) {
        return insuranceContractOwners[ownerAddress];
    }

    /**
     * @notice Gets all deployed Insurance contract addresses.
     * @return An array of addresses of all deployed Insurance contracts.
     */
    function getDeployedInsuranceContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
}
