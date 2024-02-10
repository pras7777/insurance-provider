// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Wallet.sol";

/**
 * @title WalletFactory
 * @notice This factory contract enables users to create their own instance of the Wallet contract.
 *         It keeps track of each deployed contract and associates them with their respective owners.
 */
contract WalletFactory {
    address payable public verifierCompany; // Address of the verifier company
    address[] public deployedContracts; // Stores addresses of all deployed Wallet contracts
    mapping(address => address) public contractOwners; // Maps user addresses to their Wallet contract addresses
    mapping(address => bool) public hasContract; // Tracks whether a user has deployed a Wallet contract

    /**
     * @dev Sets the verifier company's address upon deployment.
     * @param _verifierCompanyAddress Address of the verifier company.
     */
    constructor(address payable _verifierCompanyAddress) {
        require(_verifierCompanyAddress != address(0), "Verifier company address cannot be the zero address");
        verifierCompany = _verifierCompanyAddress;
    }

    /**
     * @notice Creates a new Wallet contract instance for the caller.
     */
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

    /**
     * @notice Retrieves the Wallet contract address for a specific owner.
     * @param ownerAddress The address of the contract owner.
     * @return The address of the corresponding Wallet contract.
     */
    function getWalletByOwner(address ownerAddress) external view returns (address) {
        return contractOwners[ownerAddress];
    }

    /**
     * @notice Gets all deployed Wallet contract addresses.
     * @return A list of addresses of all deployed Wallet contracts.
     */
    function getAllDeployedWallets() external view returns (address[] memory) {
        return deployedContracts;
    }
}
