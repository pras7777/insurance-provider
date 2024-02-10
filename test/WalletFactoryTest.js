// Importing necessary modules from Hardhat and Chai
const { ethers } = require("hardhat");
const { expect } = require("chai");

// Describe block for the WalletFactory contract test suite
describe("WalletFactory", function () {
    // Declaration of variables for the wallet factory, verifier company, owner, and signers
    let walletFactory, verifierCompany, owner, signer2, signer3, contractAddress;

    // before hook runs once before all the tests in this block
    before(async function () {
        // Getting signers which represent Ethereum accounts
        [owner, signer2, signer3] = await ethers.getSigners();

        // Deploying the WalletFactory contract factory
        const WalletFactory = await ethers.getContractFactory("WalletFactory");
        walletFactory = await WalletFactory.deploy(owner.address);

        // Setting verifierCompany to the owner's address
        verifierCompany = owner.address;
    });

    // Test case for creating a new wallet contract
    it("should create a new wallet contract", async function () {
        // Creating a new wallet contract through the factory
        await walletFactory.createWallet();

        // Getting the contract address associated with the owner
        contractAddress = await walletFactory.getWalletByOwner(owner.address);
        // Fetching the contract instance at the retrieved address
        const contract = await ethers.getContractAt("Wallet", contractAddress);

        // Checking if the contract exists and the verifierCompany is set correctly
        expect(contract).to.exist;
        expect(await contract.verifierCompany()).to.equal(verifierCompany);
    });

    // Test case to verify the correct contract address retrieval for an owner
    it("should return the correct contract address for an owner", async function () {
        // Retrieving the contract address for the owner
        const retrievedContractAddress = await walletFactory.getWalletByOwner(owner.address);

        // Expecting the retrieved address to match the previously stored contract address
        expect(retrievedContractAddress).to.equal(contractAddress);
    });

    // Test case to ensure the list of deployed wallet contracts is correct
    it("should return the list of deployed wallet contracts", async function () {
        // Getting the list of all deployed wallet contracts
        const deployedContracts = await walletFactory.getAllDeployedWallets();

        // Expecting the list to contain only the contractAddress created earlier
        expect(deployedContracts).to.deep.equal([contractAddress]);
    });

    // Test case to check adding a new user's wallet contract to the list of deployed contracts
    it("should add a new user's wallet contract to the list of deployed contracts", async function () {
        // Creating a new wallet contract with a different account
        await walletFactory.connect(signer3).createWallet();
    
        // Getting the updated list of deployed wallet contracts
        const deployedContracts = await walletFactory.getAllDeployedWallets();
    
        // Expecting the list to now have two contracts and include both addresses
        expect(deployedContracts).to.have.lengthOf(2);
        expect(deployedContracts).to.include(contractAddress);
    
        // Retrieving the new contract address and verifying its inclusion in the deployed contracts
        const newContractAddress = await walletFactory.getWalletByOwner(signer3.address);
        expect(deployedContracts).to.include(newContractAddress);
    });
});
