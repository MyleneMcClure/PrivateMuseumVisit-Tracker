/**
 * @title FHEVM Example Generator
 * @notice CLI tool for creating new FHEVM examples based on this template
 * @dev Automates the creation of new standalone FHEVM example repositories
 *
 * Usage: npx ts-node scripts/create-fhevm-example.ts --name "MyExample" --category "encryption"
 */

import * as fs from "fs";
import * as path from "path";

interface ExampleConfig {
  name: string;
  category: string;
  description?: string;
  contractName?: string;
  outputDir?: string;
}

class FHEVMExampleGenerator {
  private config: ExampleConfig;
  private templateDir: string;
  private outputDir: string;

  constructor(config: ExampleConfig) {
    this.config = config;
    this.templateDir = process.cwd();
    this.outputDir = config.outputDir || path.join(process.cwd(), "..", config.name);
  }

  /**
   * Main generation function
   */
  public async generate(): Promise<void> {
    console.log(`🚀 Creating new FHEVM example: ${this.config.name}`);
    console.log(`📂 Output directory: ${this.outputDir}`);

    // Create output directory
    this.createDirectory(this.outputDir);

    // Copy template structure
    await this.copyTemplateStructure();

    // Generate contract
    await this.generateContract();

    // Generate tests
    await this.generateTests();

    // Generate deployment script
    await this.generateDeployment();

    // Generate configuration files
    await this.generateConfigFiles();

    // Generate documentation
    await this.generateDocumentation();

    console.log("\n✅ Example created successfully!");
    console.log("\nNext steps:");
    console.log(`  cd ${this.config.name}`);
    console.log("  npm install");
    console.log("  npm run compile");
    console.log("  npm test");
  }

  /**
   * Create directory if it doesn't exist
   */
  private createDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Copy template directory structure
   */
  private async copyTemplateStructure(): Promise<void> {
    console.log("📋 Copying template structure...");

    // Create directories
    const dirs = ["contracts", "test", "deploy", "scripts", "docs"];
    dirs.forEach((dir) => {
      this.createDirectory(path.join(this.outputDir, dir));
    });
  }

  /**
   * Generate smart contract
   */
  private async generateContract(): Promise<void> {
    console.log("📝 Generating smart contract...");

    const contractName = this.config.contractName || this.config.name;
    const contractPath = path.join(this.outputDir, "contracts", `${contractName}.sol`);

    const contractTemplate = `// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ${contractName}
/// @notice ${this.config.description || "An FHEVM example demonstrating encrypted operations"}
/// @dev Demonstrates ${this.config.category} patterns in FHEVM
contract ${contractName} is SepoliaConfig {

    address public owner;

    /// @notice Contract constructor
    constructor() {
        owner = msg.sender;
    }

    /// @notice Example function demonstrating encrypted operations
    /// @param _value Input value to encrypt
    function exampleFunction(uint32 _value) external {
        // Encrypt the value
        euint32 encrypted = FHE.asEuint32(_value);

        // Set access permissions
        FHE.allowThis(encrypted);
        FHE.allow(encrypted, msg.sender);

        // Your logic here
    }
}
`;

    fs.writeFileSync(contractPath, contractTemplate);
    console.log(`  ✓ Created ${contractName}.sol`);
  }

  /**
   * Generate test file
   */
  private async generateTests(): Promise<void> {
    console.log("🧪 Generating test file...");

    const contractName = this.config.contractName || this.config.name;
    const testPath = path.join(this.outputDir, "test", `${contractName}.ts`);

    const testTemplate = `/**
 * @title ${contractName} Test Suite
 * @notice Comprehensive tests for the ${contractName} contract
 * @dev Demonstrates ${this.config.category} patterns in FHEVM
 *
 * @chapter: ${this.config.category}
 */

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ${contractName}, ${contractName}__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("${contractName}")) as ${contractName}__factory;
  const contract = (await factory.deploy()) as ${contractName};
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("${contractName}", function () {
  let signers: Signers;
  let contract: ${contractName};
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite requires FHEVM mock environment");
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Deployment", function () {
    it("should deploy with correct initial values", async function () {
      expect(await contract.owner()).to.equal(signers.deployer.address);
    });
  });

  describe("Core Functionality", function () {
    it("should demonstrate encrypted operations", async function () {
      // Add your test cases here
      const value = 42;
      await contract.exampleFunction(value);
      // Add assertions
    });
  });
});
`;

    fs.writeFileSync(testPath, testTemplate);
    console.log(`  ✓ Created ${contractName}.ts`);
  }

  /**
   * Generate deployment script
   */
  private async generateDeployment(): Promise<void> {
    console.log("🚀 Generating deployment script...");

    const contractName = this.config.contractName || this.config.name;
    const deployPath = path.join(this.outputDir, "deploy", "01-deploy-contract.ts");

    const deployTemplate = `import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying ${contractName}...");

  const deploymentResult = await deploy("${contractName}", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log(\`${contractName} deployed to: \${deploymentResult.address}\`);

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: deploymentResult.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
};

deployFunction.tags = ["${contractName}"];
export default deployFunction;
`;

    fs.writeFileSync(deployPath, deployTemplate);
    console.log("  ✓ Created deployment script");
  }

  /**
   * Generate configuration files
   */
  private async generateConfigFiles(): Promise<void> {
    console.log("⚙️  Generating configuration files...");

    // Copy package.json with updated name
    const packageJson = {
      name: this.config.name.toLowerCase().replace(/\s+/g, "-"),
      description: this.config.description || `FHEVM example demonstrating ${this.config.category}`,
      version: "1.0.0",
      license: "BSD-3-Clause-Clear",
      scripts: {
        clean: "rimraf ./fhevmTemp ./artifacts ./cache ./coverage ./types ./coverage.json ./dist",
        compile: "cross-env TS_NODE_TRANSPILE_ONLY=true hardhat compile",
        test: "hardhat test",
        "deploy:localhost": "hardhat deploy --network localhost",
        "deploy:sepolia": "hardhat deploy --network sepolia",
      },
      dependencies: {
        "encrypted-types": "^0.0.4",
        "@fhevm/solidity": "^0.9.1",
      },
      devDependencies: {
        "@fhevm/hardhat-plugin": "^0.3.0-1",
        "@nomicfoundation/hardhat-chai-matchers": "^2.1.0",
        "@nomicfoundation/hardhat-ethers": "^3.1.0",
        hardhat: "^2.26.0",
        "hardhat-deploy": "^0.11.45",
        ethers: "^6.15.0",
        typescript: "^5.8.3",
        "ts-node": "^10.9.2",
      },
    };

    fs.writeFileSync(
      path.join(this.outputDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
    console.log("  ✓ Created package.json");

    // Copy other config files
    this.copyConfigFile("hardhat.config.ts");
    this.copyConfigFile("tsconfig.json");
    this.copyConfigFile(".gitignore");
    this.copyConfigFile(".eslintrc.yml");
    this.copyConfigFile(".prettierrc.yml");
  }

  /**
   * Copy a single config file
   */
  private copyConfigFile(filename: string): void {
    const src = path.join(this.templateDir, filename);
    const dest = path.join(this.outputDir, filename);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Created ${filename}`);
    }
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(): Promise<void> {
    console.log("📚 Generating documentation...");

    const contractName = this.config.contractName || this.config.name;
    const readmePath = path.join(this.outputDir, "README.md");

    const readmeTemplate = `# ${this.config.name}

${this.config.description || `FHEVM example demonstrating ${this.config.category} patterns`}

## Overview

This example demonstrates how to use FHEVM to build privacy-preserving smart contracts with focus on ${this.config.category}.

## Quick Start

### Installation

\`\`\`bash
npm install
\`\`\`

### Compilation

\`\`\`bash
npm run compile
\`\`\`

### Testing

\`\`\`bash
npm test
\`\`\`

### Deployment

**Local Network:**
\`\`\`bash
npm run deploy:localhost
\`\`\`

**Sepolia Testnet:**
\`\`\`bash
npm run deploy:sepolia
\`\`\`

## Project Structure

\`\`\`
.
├── contracts/
│   └── ${contractName}.sol    # Main contract
├── test/
│   └── ${contractName}.ts      # Test suite
├── deploy/
│   └── 01-deploy-contract.ts   # Deployment script
├── hardhat.config.ts           # Hardhat configuration
└── package.json                # Dependencies
\`\`\`

## Features

- Encrypted data operations using FHEVM
- Privacy-preserving computations
- Access control patterns
- Comprehensive test suite

## FHEVM Concepts Demonstrated

- Encryption with FHE.asEuint()
- Access control with FHE.allow()
- ${this.config.category} patterns

## License

BSD-3-Clause-Clear

---

Built with [Zama FHEVM](https://docs.zama.ai/fhevm)
`;

    fs.writeFileSync(readmePath, readmeTemplate);
    console.log("  ✓ Created README.md");
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): ExampleConfig {
  const args = process.argv.slice(2);
  const config: Partial<ExampleConfig> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace("--", "");
    const value = args[i + 1];
    config[key as keyof ExampleConfig] = value;
  }

  if (!config.name || !config.category) {
    console.error("Usage: npx ts-node scripts/create-fhevm-example.ts --name <name> --category <category>");
    console.error("\nOptions:");
    console.error("  --name        Example name (required)");
    console.error("  --category    Example category (required)");
    console.error("  --description Example description (optional)");
    console.error("  --contractName Contract name (optional, defaults to name)");
    console.error("  --outputDir   Output directory (optional)");
    console.error("\nExample:");
    console.error('  npx ts-node scripts/create-fhevm-example.ts --name "MyExample" --category "encryption"');
    process.exit(1);
  }

  return config as ExampleConfig;
}

/**
 * Main execution
 */
async function main() {
  try {
    const config = parseArgs();
    const generator = new FHEVMExampleGenerator(config);
    await generator.generate();
  } catch (error) {
    console.error("Error generating example:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { FHEVMExampleGenerator, ExampleConfig };
