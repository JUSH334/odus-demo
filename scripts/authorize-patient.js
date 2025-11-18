const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("AUTHORIZE PATIENT FOR MEDICAL RECORDS");
  console.log("========================================\n");

  // CONFIGURE THESE VALUES
  const CONTRACT_ADDRESS = "0x78617B48680a83588a6bCAA9a7d39a39031cdc45"; // UPDATE THIS
  const PATIENT_ADDRESS = "0xfb3c61dcc2df6800c62e7ba2bca5e9dd7d42f2f7";           // UPDATE THIS

  // Validation
  if (CONTRACT_ADDRESS === "0xYourMedicalRecordsContractAddress") {
    console.error("ERROR: Please update CONTRACT_ADDRESS in the script");
    console.log("\nSteps:");
    console.log("1. Deploy MedicalRecords contract if not done");
    console.log("2. Copy the deployed contract address");
    console.log("3. Update CONTRACT_ADDRESS in this script");
    process.exit(1);
  }

  if (PATIENT_ADDRESS === "0xYourPatientWalletAddress") {
    console.error("ERROR: Please update PATIENT_ADDRESS in the script");
    console.log("\nSteps:");
    console.log("1. Get the patient's MetaMask wallet address");
    console.log("2. Update PATIENT_ADDRESS in this script");
    process.exit(1);
  }

  // Validate address format
  if (!hre.ethers.isAddress(CONTRACT_ADDRESS)) {
    console.error("ERROR: Invalid contract address format");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    process.exit(1);
  }

  if (!hre.ethers.isAddress(PATIENT_ADDRESS)) {
    console.error("ERROR: Invalid patient address format");
    console.log("Patient Address:", PATIENT_ADDRESS);
    process.exit(1);
  }

  try {
    // Get deployer (must be contract owner)
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("Owner Address:", deployerAddress);
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Patient Address:", PATIENT_ADDRESS);
    console.log("");

    // Get contract instance
    console.log("Connecting to MedicalRecords contract...");
    const MedicalRecords = await hre.ethers.getContractAt(
      "MedicalRecords", 
      CONTRACT_ADDRESS
    );
    console.log("✓ Connected to contract\n");

    // Check if patient is already authorized
    console.log("Checking current authorization status...");
    const isAlreadyAuthorized = await MedicalRecords.isPatientAuthorized(PATIENT_ADDRESS);
    
    if (isAlreadyAuthorized) {
      console.log("⚠️  Patient is already authorized!");
      console.log("\nNo action needed. Patient can already upload medical records.");
      process.exit(0);
    }
    
    console.log("✓ Patient is not yet authorized\n");

    // Authorize the patient
    console.log("Authorizing patient...");
    const tx = await MedicalRecords.authorizePatient(PATIENT_ADDRESS);
    
    console.log("Transaction sent:", tx.hash);
    console.log("View on explorer: https://explorer.didlab.org/tx/" + tx.hash);
    console.log("\nWaiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log("\n========================================");
    console.log("✓ PATIENT AUTHORIZED SUCCESSFULLY!");
    console.log("========================================");
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    
    // Verify authorization
    console.log("\nVerifying authorization...");
    const isNowAuthorized = await MedicalRecords.isPatientAuthorized(PATIENT_ADDRESS);
    
    if (isNowAuthorized) {
      console.log("✓ Verification successful!");
      console.log("\nPatient can now:");
      console.log("  • Upload medical records to blockchain");
      console.log("  • View their medical records");
      console.log("  • Manage their records");
    } else {
      console.log("⚠️  Verification failed. Please check manually.");
    }
    
    console.log("\n========================================\n");

  } catch (error) {
    console.error("\n========================================");
    console.error("❌ AUTHORIZATION FAILED");
    console.error("========================================");
    console.error("Error:", error.message);
    
    if (error.message.includes("Only owner")) {
      console.log("\n💡 TIP: You must be the contract owner to authorize patients");
      console.log("Make sure you're using the same wallet that deployed the contract");
    }
    
    if (error.message.includes("cannot estimate gas")) {
      console.log("\n💡 TIP: Transaction will likely fail");
      console.log("Possible reasons:");
      console.log("  • Contract address is incorrect");
      console.log("  • You're not the contract owner");
      console.log("  • Patient address is invalid");
    }
    
    console.log("\n");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });