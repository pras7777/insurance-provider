// Importing the necessary modules from Chai and Hardhat
const { expect } = require('chai');
const { ethers } = require('hardhat');

// Describe block for the Wallet contract test suite
describe('Wallet', function () {
  let wallet, verifierCompany, user1;

  // beforeEach hook runs before each test, setting up the contract and signers
  beforeEach(async function () {
    const Wallet = await ethers.getContractFactory('Wallet');
    [verifierCompany, user1] = await ethers.getSigners();

    // Deploying the Wallet contract with the verifierCompany address
    wallet = await Wallet.deploy(verifierCompany.address);
  });

  // Test case for allowing users to select an insurance package and pay the premium
  it('should allow users to select an insurance package and pay premium', async function () {
    const insurancePackage = 1; // Insurance package identifier
    const premiumAmount = 10000; // Premium amount in Wei

    // User selects a package and pays the premium
    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });

    // Fetching and verifying user's data from the contract
    const user1Data = await wallet.users(user1.address);
    expect(user1Data.package).to.equal(insurancePackage);
    expect(user1Data.premiumAmount).to.equal(premiumAmount);
    expect(user1Data.isActive).to.equal(true);
  });

  // Test case for rejecting the selection of an invalid insurance package
  it('should reject selecting an invalid insurance package', async function () {
    const invalidPackage = 4; // Invalid package identifier

    // Expecting the contract call to revert for an invalid package
    await expect(wallet.connect(user1).selectPackage(invalidPackage, { value: 1000 })).to.be.reverted;
  });

  // Test case for rejecting package selection for an already active user
  it('should reject selecting an insurance package for an already active user', async function () {
    const insurancePackage = 0; // Insurance package identifier

    // User selects a package
    await wallet.connect(user1).selectPackage(insurancePackage, { value: 1000 });

    // Expecting the contract call to revert for a user with an active package
    await expect(wallet.connect(user1).selectPackage(insurancePackage, { value: 1000 }))
      .to.be.revertedWith('User already has an active insurance package.');
  });

  // Test case for submitting and approving a claim
  it('should allow users to submit a claim and admin to approve it', async function () {
    const insurancePackage = 1; // Insurance package identifier
    const premiumAmount = 10000; // Premium amount in Wei

    // User selects a package and submits a claim
    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).submitClaim();

    // Verifying claim status before and after approval
    const claimStatusBefore = await wallet.claims(user1.address);
    expect(claimStatusBefore).to.equal(0); // 0 indicates no status or pending

    await wallet.connect(verifierCompany).approveClaim(user1.address);

    const claimStatusAfter = await wallet.claims(user1.address);
    expect(claimStatusAfter).to.equal(1); // 1 indicates approved
  });

  // Test case for rejecting claim approval for an inactive user
  it('should reject approving a claim for an inactive user', async function () {
    // Expecting the contract call to revert for an inactive user
    await expect(wallet.connect(verifierCompany).approveClaim(user1.address))
      .to.be.revertedWith('User does not have an active insurance package.');
  });

  // Test case for rejecting approval of a non-pending claim
  it('should reject approving a claim that is not pending', async function () {
    const insurancePackage = 1; // Insurance package identifier
    const premiumAmount = 10000; // Premium amount in Wei

    // User selects a package, submits a claim, and the claim is approved
    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).submitClaim();
    await wallet.connect(verifierCompany).approveClaim(user1.address);

    // Expecting the contract call to revert as there's no pending claim
    await expect(wallet.connect(verifierCompany).approveClaim(user1.address))
      .to.be.revertedWith('No pending claim for this user.');
  });

  // Test case for rejecting claim rejection for an inactive user
  it('should reject rejecting a claim for an inactive user', async function () {
    // Expecting the contract call to revert for an inactive user
    await expect(wallet.connect(verifierCompany).rejectClaim(user1.address))
      .to.be.revertedWith('User does not have an active insurance package.');
  });

  // Test case for rejecting claim rejection if the claim is not pending
  it('should reject rejecting a claim that is not pending', async function () {
    const insurancePackage = 1; // Insurance package identifier
    const premiumAmount = 10000; // Premium amount in Wei

    // User selects a package, submits a claim, and the claim is approved
    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).submitClaim();
    await wallet.connect(verifierCompany).approveClaim(user1.address);

    // Expecting the contract call to revert as there's no pending claim
    await expect(wallet.connect(verifierCompany).rejectClaim(user1.address))
      .to.be.revertedWith('No pending claim for this user.');
  });

  // Test case for allowing users to cancel their insurance
  it('should allow users to cancel their insurance', async function () {
    const insurancePackage = 0; // Insurance package identifier
    const premiumAmount = 1000; // Premium amount in Wei

    // User selects a package and then cancels the insurance
    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).cancelInsurance();

    // Verifying that the user's insurance is inactive
    const user1Data = await wallet.users(user1.address);
    expect(user1Data.isActive).to.equal(false);
  });

  // Test case for rejecting cancellation for an inactive user
  it('should reject canceling insurance for an inactive user', async function () {
    // Expecting the contract call to revert for an inactive user
    await expect(wallet.connect(user1).cancelInsurance())
      .to.be.revertedWith('User does not have an active insurance package.');
  });

  // Test case for allowing users to pay their premium
  it('should allow users to pay their premium', async function () {
    const insurancePackage = 0; // Insurance package identifier
    const premiumAmount = 10000; // Premium amount in Wei
    const premiumAmountWei = BigInt(premiumAmount);

    // User selects a package
    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmountWei });

    // Simulating the passage of time for the premium payment interval
    const paymentInterval = 28 * 24 * 60 * 60; // 28 days in seconds
    const elapsedTime = paymentInterval + 1; // Time elapsed after the interval

    // Advancing the blockchain time and mining a new block
    await ethers.provider.send('evm_increaseTime', [elapsedTime]);
    await ethers.provider.send('evm_mine');

    // User pays the premium to the verifier
    await wallet.connect(user1).payPremiumToVerifier({ value: premiumAmount });

    // Fetching and verifying the user's total payments
    const user1Data = await wallet.users(user1.address);
    expect(user1Data.totalPayments).to.equal(2); // Expecting 2 total payments (initial and this one)
  });  
});
