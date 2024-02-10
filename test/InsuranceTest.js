// Importing necessary modules from Chai and Hardhat
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Describe block for the Insurance contract test suite
describe('Insurance', function () {
    // Declaration of variables for the insurance contract and users
    let insurance, owner, user0, user1;

    // Constants for premium and collateral values for two categories
    const CATEGORY_A_PREMIUM = ethers.utils.parseEther('0.0001'); 
    const CATEGORY_B_PREMIUM = ethers.utils.parseEther('0.00001'); 
    const CATEGORY_A_COLLATERAL = ethers.utils.parseEther('3'); 
    const CATEGORY_B_COLLATERAL = ethers.utils.parseEther('2'); 

    // beforeEach hook runs before each test, setting up the contract and signers
    beforeEach(async function () {
        [owner, user0, user1] = await ethers.getSigners();
        const Insurance = await ethers.getContractFactory('Insurance');
        insurance = await Insurance.deploy(owner.address);
    });

    // Test suite for deployment-related aspects
    describe('Deployment', function () {
        it('Should set the correct verifierCompany', async function () {
            // Verifying the verifierCompany is set to the owner's address
            expect(await insurance.verifierCompany()).to.equal(owner.address);
        });
    });

    // Test suite for setting collateral value
    describe('setCollateralValue', function () {
        it('Should set collateral value for a user', async function () {
            // Setting and verifying collateral value for a user
            await insurance.connect(user0).setCollateralValue(CATEGORY_A_COLLATERAL);
            const user = await insurance.users(user0.address);
            expect(user.collateralAmount).to.equal(CATEGORY_A_COLLATERAL);
            expect(user.collateralDropped).to.be.false;
            expect(user.isApproved).to.be.false;
            expect(user.lastPaymentTimestamp).to.equal(ethers.BigNumber.from(0));
        });

        it('Should not set collateral value exceeding the limit', async function () {
            // Expecting an error when trying to set a collateral value above the limit
            await expect(insurance.connect(user0).setCollateralValue(CATEGORY_A_COLLATERAL.add(1))).to.be.revertedWith('Collateral value exceeds the limit');
        });
    });

    // Test suite for setting collateral status
    describe('setCollateralStatus', function () {
        beforeEach(async function () {
            // Setting collateral value before each test
            await insurance.connect(user0).setCollateralValue(CATEGORY_A_COLLATERAL);
        });

        it('Should set collateral status for a user', async function () {
            // Setting and verifying collateral status for a user
            await insurance.connect(user0).setCollateralStatus(true);
            const user = await insurance.users(user0.address);
            expect(user.collateralDropped).to.be.true;
            expect(user.isApproved).to.be.false;
        });

        it('Should require collateral value to be set', async function () {
            // Expecting an error when trying to set collateral status without setting collateral value
            await expect(insurance.connect(user1).setCollateralStatus(true)).to.be.revertedWith('No collateral value set');
        });
    });

    // Test suite for paying premium in Category A
    describe('payPremiumCategoryA', function () {
        beforeEach(async function () {
            // Setting collateral value before each test
            await insurance.connect(user0).setCollateralValue(CATEGORY_A_COLLATERAL);
        });

        it('Should allow Category A user to pay premium', async function () {
            // Verifying that a Category A user can pay the premium without reverting
            await expect(insurance.connect(user0).payPremiumCategoryA({ value: CATEGORY_A_PREMIUM })).to.not.be.reverted;
        });

        it('Should not allow payment below the premium amount', async function () {
            // Expecting an error when the payment is below the premium amount
            await expect(insurance.connect(user0).payPremiumCategoryA({value: CATEGORY_A_PREMIUM.sub(ethers.utils.parseEther('0.0001')) })).to.be.revertedWith('Incorrect premium amount');
        });

        it('Should transfer premium amount to the verifierCompany', async function () {
            // Verifying that the premium amount is transferred to the verifierCompany
            const initialBalance = await ethers.provider.getBalance(owner.address);
            await insurance.connect(user0).payPremiumCategoryA({ value: CATEGORY_A_PREMIUM });
            const finalBalance = await ethers.provider.getBalance(owner.address);
            expect(finalBalance).to.equal(initialBalance.add(CATEGORY_A_PREMIUM));
        });
    });

    // Test suite for paying premium in Category B
    describe('payPremiumCategoryB', function () {
        beforeEach(async function () {
            // Setting collateral value before each test
            await insurance.connect(user1).setCollateralValue(CATEGORY_B_COLLATERAL);
        });

        it('Should allow Category B user to pay premium', async function () {
            // Verifying that a Category B user can pay the premium without reverting
            await expect(insurance.connect(user1).payPremiumCategoryB({ value: CATEGORY_B_PREMIUM })).to.not.be.reverted;
        });

        it('Should not allow payment below the premium amount', async function () {
            // Expecting an error when the payment is below the premium amount
            await expect(insurance.connect(user1).payPremiumCategoryB({ value: CATEGORY_B_PREMIUM.sub(ethers.utils.parseEther('0.00001')) })).to.be.revertedWith('Incorrect premium amount');
        });

        it('Should transfer premium amount to the verifierCompany', async function () {
            // Verifying that the premium amount is transferred to the verifierCompany
            const initialBalance = await ethers.provider.getBalance(owner.address);
            await insurance.connect(user1).payPremiumCategoryB({ value: CATEGORY_B_PREMIUM });
            const finalBalance = await ethers.provider.getBalance(owner.address);
            expect(finalBalance).to.equal(initialBalance.add(CATEGORY_B_PREMIUM));
        });
    });
});
