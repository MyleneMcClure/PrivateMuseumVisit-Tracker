/**
 * @title PrivateMuseumVisitTracker Deployment Script
 * @notice Hardhat deployment script for the PrivateMuseumVisitTracker contract
 * @dev Uses hardhat-deploy for automated deployment and verification
 */

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying PrivateMuseumVisitTracker...");

  const deploymentResult = await deploy("PrivateMuseumVisitTracker", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log(`PrivateMuseumVisitTracker deployed to: ${deploymentResult.address}`);

  // Verify on block explorer if running on public network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      await hre.run("verify:verify", {
        address: deploymentResult.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      if ((error as any).message.includes("Already Verified")) {
        console.log("Contract already verified");
      } else {
        console.log("Verification failed:", error);
      }
    }
  }
};

deployFunction.tags = ["PrivateMuseumVisitTracker"];
export default deployFunction;
