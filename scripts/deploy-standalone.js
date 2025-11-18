const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("DEPLOYING STANDALONE MEDICAL RECORDS");
  console.log("========================================\n");

  try {
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("Deployer:", deployerAddress);
    console.log("Balance:", hre.ethers.formatEther(balance), "TT\n");

    if (balance === 0n) {
      console.error("ERROR: Zero balance! Get tokens from https://faucet.didlab.org");
      process.exit(1);
    }

    // Deploy MedicalRecords contract
    console.log("Deploying MedicalRecords contract...");
    const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
    const medicalRecords = await MedicalRecords.deploy();
    
    const deployTx = medicalRecords.deploymentTransaction();
    console.log("Transaction sent:", deployTx.hash);
    console.log("View: https://explorer.didlab.org/tx/" + deployTx.hash);
    
    console.log("Waiting for confirmation...");
    await medicalRecords.waitForDeployment();
    
    const contractAddress = await medicalRecords.getAddress();
    console.log("✓ MedicalRecords deployed!");
    console.log("Address:", contractAddress);

    // Authorize the deployer as a patient (for testing)
    console.log("\nAuthorizing deployer address...");
    const authTx = await medicalRecords.authorizePatient(deployerAddress);
    await authTx.wait();
    console.log("✓ Deployer authorized!");

    // Test adding a medical record
    console.log("\nTesting medical record upload...");
    const recordId = "REC-TEST-" + Date.now();
    const recordHash = hre.ethers.id("test medical record data");
    const recordType = "lab";
    const metadata = JSON.stringify({
      title: "Test Lab Results",
      description: "Blood test results",
      timestamp: new Date().toISOString()
    });
    
    const addRecordTx = await medicalRecords.addMedicalRecord(
      recordId,
      recordHash,
      recordType,
      metadata
    );
    await addRecordTx.wait();
    console.log("✓ Test medical record added!");

    // Get record count
    const recordCount = await medicalRecords.getMyRecordCount();
    console.log("Record count:", recordCount.toString());

    // Get the record details
    const record = await medicalRecords.getMedicalRecord(deployerAddress, 0);
    console.log("\nRecord details:");
    console.log("  ID:", record.recordId);
    console.log("  Type:", record.recordType);
    console.log("  Active:", record.isActive);

    // Get contract stats
    const totalRecords = await medicalRecords.getTotalRecords();
    console.log("\nTotal records in system:", totalRecords.toString());

    // Save deployment info with ABI
    const artifact = await hre.artifacts.readArtifact("MedicalRecords");
    
    const deploymentInfo = {
      network: "didlab",
      chainId: 252501,
      deployer: deployerAddress,
      deploymentTime: new Date().toISOString(),
      contract: {
        name: "MedicalRecords",
        address: contractAddress,
        transactionHash: deployTx.hash,
        blockNumber: deployTx.blockNumber,
        abi: artifact.abi
      },
      features: [
        "Standalone Medical Records",
        "Authorization System",
        "Record Management",
        "On-chain Data Storage",
        "Can work independently or with PatientRegistry"
      ],
      testData: {
        testRecordId: recordId,
        recordCount: recordCount.toString(),
        authorizedAddress: deployerAddress
      }
    };

    // Save to file
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, "didlab-medical-records.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    // Save ABI separately for frontend
    const abiFile = path.join(deploymentsDir, "MedicalRecords-ABI.json");
    fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));

    console.log("\n========================================");
    console.log("DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("\nFiles saved:");
    console.log("  Deployment info:", deploymentFile);
    console.log("  ABI:", abiFile);
    console.log("\nContract Address:", contractAddress);
    console.log("\nView on Explorer:");
    console.log("  https://explorer.didlab.org/address/" + contractAddress);
    console.log("\nUpdate your frontend:");
    console.log("  CONTRACT_ADDRESS =", contractAddress);
    console.log("\nIMPORTANT: To authorize additional patients, call:");
    console.log("  contract.authorizePatient(patientAddress)");
    console.log("\n========================================\n");

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED");
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
