
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("WalletFactory", function () {
 
    let walletFactory, verifierCompany, owner, signer2, signer3, contractAddress;

   
    before(async function () {
 
        [owner, signer2, signer3] = await ethers.getSigners();

        const WalletFactory = await ethers.getContractFactory("WalletFactory");
        walletFactory = await WalletFactory.deploy(owner.address);

        verifierCompany = owner.address;
    });

    it("should create a new wallet contract", async function () {
      
        await walletFactory.createWallet();

        contractAddress = await walletFactory.getWalletByOwner(owner.address);
     
        const contract = await ethers.getContractAt("Wallet", contractAddress);

        expect(contract).to.exist;
        expect(await contract.verifierCompany()).to.equal(verifierCompany);
    });

    it("should return the correct contract address for an owner", async function () {
   
        const retrievedContractAddress = await walletFactory.getWalletByOwner(owner.address);

        expect(retrievedContractAddress).to.equal(contractAddress);
    });

    it("should return the list of deployed wallet contracts", async function () {
  
        const deployedContracts = await walletFactory.getAllDeployedWallets();

        expect(deployedContracts).to.deep.equal([contractAddress]);
    });

    it("should add a new user's wallet contract to the list of deployed contracts", async function () {
      
        await walletFactory.connect(signer3).createWallet();
    
        const deployedContracts = await walletFactory.getAllDeployedWallets();
    
 
        expect(deployedContracts).to.have.lengthOf(2);
        expect(deployedContracts).to.include(contractAddress);

        const newContractAddress = await walletFactory.getWalletByOwner(signer3.address);
        expect(deployedContracts).to.include(newContractAddress);
    });
});
