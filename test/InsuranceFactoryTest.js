// Importing the required modules from Hardhat and Chai
const { ethers } = require("hardhat");
const { expect } = require("chai");

// Describe block defines a test suite for the InsuranceFactory contract
describe("InsuranceFactory", () => {
    // Declaration of variables that will be used in the tests
    let InsuranceFactory, Insurance, insuranceFactory;
    let verifierCompany, owner, addr1, addr2;

    // 'before' hook runs once before all the tests in the describe block
    before(async () => {
        // Getting signers which represent Ethereum accounts
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploying the InsuranceFactory and Insurance contract factories
        InsuranceFactory = await ethers.getContractFactory("InsuranceFactory");
        Insurance = await ethers.getContractFactory("Insurance");

        // Setting the verifierCompany to the address of the owner account
        verifierCompany = owner.address;
        // Deploying the InsuranceFactory contract with the verifierCompany as a constructor argument
        insuranceFactory = await InsuranceFactory.deploy(verifierCompany);
    });

    // Test case to verify the creation of a new insurance contract
    it("should create a new insurance contract", async () => {
        // Creating a new insurance contract through the factory
        await insuranceFactory.createInsurance();

        // Getting the contract address associated with the owner
        const contractAddress = await insuranceFactory.getInsuranceContractByOwner(owner.address);
        // Expecting the contract address to not be null, indicating successful creation
        expect(contractAddress).to.not.be.null;
    });

    // Test case to check correct insurance contract retrieval for an owner
    it("should return the correct insurance contract for an owner", async () => {
        // Retrieving contract addresses for two different owners
        const contractAddress1 = await insuranceFactory.getInsuranceContractByOwner(owner.address);
        const contractAddress2 = await insuranceFactory.getInsuranceContractByOwner(addr1.address);

        // Expecting these addresses to be different, signifying unique contracts for each owner
        expect(contractAddress1).to.not.equal(contractAddress2);
    });

    // Test case to ensure the list of deployed insurance contracts is correct
    it("should return the list of deployed insurance contracts", async () => {
        // Creating another insurance contract with a different account
        await insuranceFactory.connect(addr2).createInsurance();

        // Retrieving the list of all deployed insurance contracts
        const deployedContracts = await insuranceFactory.getDeployedInsuranceContracts();

        // Expecting the length of deployed contracts array to be 2 (two contracts created)
        expect(deployedContracts).to.have.lengthOf(2);
    });

    // Test case to check prevention of multiple contracts for the same address
    it("should not allow creating multiple contracts for the same address", async () => {
        // Expecting an error when trying to create a second insurance contract for the same address
        await expect(insuranceFactory.createInsurance()).to.be.revertedWith(
            "Contract already exists for this address"
        );
    });
});
