
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Wallet', function () {
  let wallet, verifierCompany, user1;

  beforeEach(async function () {
    const Wallet = await ethers.getContractFactory('Wallet');
    [verifierCompany, user1] = await ethers.getSigners();

    wallet = await Wallet.deploy(verifierCompany.address);
  });

  it('should allow users to select an insurance package and pay premium', async function () {
    const insurancePackage = 1;
    const premiumAmount = 10000;

    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });

    const user1Data = await wallet.users(user1.address);
    expect(user1Data.package).to.equal(insurancePackage);
    expect(user1Data.premiumAmount).to.equal(premiumAmount);
    expect(user1Data.isActive).to.equal(true);
  });

  it('should reject selecting an invalid insurance package', async function () {
    const invalidPackage = 4;

    await expect(wallet.connect(user1).selectPackage(invalidPackage, { value: 1000 })).to.be.reverted;
  });

  it('should reject selecting an insurance package for an already active user', async function () {
    const insurancePackage = 0;

    await wallet.connect(user1).selectPackage(insurancePackage, { value: 1000 });

    await expect(wallet.connect(user1).selectPackage(insurancePackage, { value: 1000 }))
      .to.be.revertedWith('User already has an active insurance package.');
  });

  it('should allow users to submit a claim and admin to approve it', async function () {
    const insurancePackage = 1; 
    const premiumAmount = 10000; 

    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).submitClaim();

    const claimStatusBefore = await wallet.claims(user1.address);
    expect(claimStatusBefore).to.equal(0); 

    await wallet.connect(verifierCompany).approveClaim(user1.address);

    const claimStatusAfter = await wallet.claims(user1.address);
    expect(claimStatusAfter).to.equal(1); 
  });

  it('should reject approving a claim for an inactive user', async function () {
 
    await expect(wallet.connect(verifierCompany).approveClaim(user1.address))
      .to.be.revertedWith('User does not have an active insurance package.');
  });

  it('should reject approving a claim that is not pending', async function () {
    const insurancePackage = 1;
    const premiumAmount = 10000; 

    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).submitClaim();
    await wallet.connect(verifierCompany).approveClaim(user1.address);

    await expect(wallet.connect(verifierCompany).approveClaim(user1.address))
      .to.be.revertedWith('No pending claim for this user.');
  });

  it('should reject rejecting a claim for an inactive user', async function () {
 
    await expect(wallet.connect(verifierCompany).rejectClaim(user1.address))
      .to.be.revertedWith('User does not have an active insurance package.');
  });
g
  it('should reject rejecting a claim that is not pending', async function () {
    const insurancePackage = 1; 
    const premiumAmount = 10000; 

    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).submitClaim();
    await wallet.connect(verifierCompany).approveClaim(user1.address);

    await expect(wallet.connect(verifierCompany).rejectClaim(user1.address))
      .to.be.revertedWith('No pending claim for this user.');
  });

  it('should allow users to cancel their insurance', async function () {
    const insurancePackage = 0; 
    const premiumAmount = 1000; 

    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmount });
    await wallet.connect(user1).cancelInsurance();

    const user1Data = await wallet.users(user1.address);
    expect(user1Data.isActive).to.equal(false);
  });

  it('should reject canceling insurance for an inactive user', async function () {

    await expect(wallet.connect(user1).cancelInsurance())
      .to.be.revertedWith('User does not have an active insurance package.');
  });

  it('should allow users to pay their premium', async function () {
    const insurancePackage = 0; 
    const premiumAmount = 10000;
    const premiumAmountWei = BigInt(premiumAmount);

    await wallet.connect(user1).selectPackage(insurancePackage, { value: premiumAmountWei });

    const paymentInterval = 28 * 24 * 60 * 60; 
    const elapsedTime = paymentInterval + 1; 

    await ethers.provider.send('evm_increaseTime', [elapsedTime]);
    await ethers.provider.send('evm_mine');

    await wallet.connect(user1).payPremiumToVerifier({ value: premiumAmount });

    const user1Data = await wallet.users(user1.address);
    expect(user1Data.totalPayments).to.equal(2);
  });  
});
