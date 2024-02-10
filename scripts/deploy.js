const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy the InsuranceFactory contract
    const InsuranceFactory = await ethers.getContractFactory("InsuranceFactory");
    const insuranceFactory = await InsuranceFactory.deploy(deployer.address);
    await insuranceFactory.deployed();
    console.log("InsuranceFactory contract deployed to:", insuranceFactory.address);

    // Create an Insurance contract instance through the InsuranceFactory
    const createInsuranceTx = await insuranceFactory.createInsurance();
    await createInsuranceTx.wait();
    const deployedInsuranceAddresses = await insuranceFactory.getDeployedInsuranceContracts();
    console.log("Deployed Insurance contract address:", deployedInsuranceAddresses[0]);

    // Deploy the WalletFactory contract
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    const walletFactory = await WalletFactory.deploy(deployer.address);
    await walletFactory.deployed();
    console.log("WalletFactory contract deployed to:", walletFactory.address);

    // Create a Wallet contract instance through the WalletFactory
    const createWalletTx = await walletFactory.createWallet();
    await createWalletTx.wait();
    const deployedWalletAddresses = await walletFactory.getAllDeployedWallets();
    console.log("Deployed Wallet contract address:", deployedWalletAddresses[0]);

    console.log("Deployment completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
/*

npm install
npx hardhat test
 npx hardhat run scripts/deploy.js --network sepolia

*/