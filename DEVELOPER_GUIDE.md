# Developer Guide

A comprehensive guide for developers working with and extending the Private Museum Visit Tracker FHEVM example.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Development Setup](#development-setup)
4. [Working with FHEVM](#working-with-fhevm)
5. [Extending the Contract](#extending-the-contract)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Documentation](#documentation)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Introduction

This project demonstrates privacy-preserving visitor analytics for museums using Fully Homomorphic Encryption (FHE) on Ethereum. It serves as both a functional application and an educational example of FHEVM patterns.

### Key Features

- Encrypted visitor age and feedback
- Privacy-preserving aggregate statistics
- Access control using FHE.allow patterns
- User and public decryption flows
- Museum manager administration

### Technology Stack

- **Blockchain:** Ethereum (Sepolia Testnet)
- **Encryption:** Zama FHEVM
- **Framework:** Hardhat
- **Language:** Solidity 0.8.24
- **Testing:** Mocha + Chai
- **TypeScript:** For tests and scripts

## Architecture

### Contract Structure

```
PrivateMuseumVisitTracker
├── State Variables
│   ├── owner, museumManager
│   ├── totalExhibitions, totalRegisteredVisitors
│   └── Mappings (exhibitions, visitorProfiles, visitRecords)
├── Enums
│   ├── AgeGroup
│   └── ExhibitionType
├── Structs
│   ├── Exhibition
│   ├── VisitorProfile
│   └── PrivateVisitRecord
├── Modifiers
│   ├── onlyOwner
│   ├── onlyMuseumManager
│   └── onlyRegisteredVisitor
├── Core Functions
│   ├── registerVisitor
│   ├── createExhibition
│   └── recordPrivateVisit
└── View Functions
    ├── getPublicStats
    ├── getExhibitionInfo
    └── getMyStats
```

### Data Flow

1. **Visitor Registration:**
   ```
   User Input → Encrypt Age → Store euint8 → Set Permissions
   ```

2. **Visit Recording:**
   ```
   Visitor Input → Encrypt Feedback → Store Records → Update Statistics
   ```

3. **Statistics Request:**
   ```
   Manager Request → Prepare Encrypted Data → Request Decryption → Off-chain Processing
   ```

### Privacy Model

**Encrypted:**
- Individual visitor ages
- Visit satisfaction ratings
- Interest levels
- Visit durations
- Aggregate counters

**Public:**
- Exhibition names and types
- Exhibition dates
- Total visitor counts (aggregate only)
- Registration status

## Development Setup

### Prerequisites

```bash
# Check Node.js version (>= 20)
node --version

# Check npm version (>= 7)
npm --version
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd PrivateMuseumVisitTracker

# Install dependencies
npm install

# Compile contracts
npm run compile
```

### Environment Configuration

Create `.env` file:

```bash
# Mnemonic for deployment
MNEMONIC="test test test test test test test test test test test junk"

# Infura API key for Sepolia
INFURA_API_KEY="your_infura_api_key"

# Etherscan API key for verification
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

**Note:** Never commit `.env` to version control.

### Verify Setup

```bash
# Run tests
npm test

# Check compilation
npm run compile

# Verify types are generated
ls types/
```

## Working with FHEVM

### Encrypted Types

#### euint8 (8-bit)
Use for small values (0-255):
```solidity
euint8 encryptedAge = FHE.asEuint8(_age);
euint8 encryptedRating = FHE.asEuint8(_satisfaction);
```

#### euint32 (32-bit)
Use for larger values:
```solidity
euint32 encryptedCount = FHE.asEuint32(_count);
euint32 encryptedTimestamp = FHE.asEuint32(uint32(block.timestamp));
```

### Basic Operations

#### Encryption

```solidity
// Encrypt plaintext value
euint8 encrypted = FHE.asEuint8(plainValue);
```

#### Addition

```solidity
// Add encrypted values
euint32 sum = FHE.add(encryptedValue1, encryptedValue2);
```

#### Comparison

```solidity
// Compare encrypted values
ebool isEqual = FHE.eq(encrypted1, encrypted2);
ebool isGreater = FHE.gt(encrypted1, encrypted2);
```

### Access Control Patterns

#### Allow Contract Access

```solidity
// Contract can decrypt when needed
FHE.allowThis(encryptedValue);
```

#### Allow User Access

```solidity
// User can decrypt their own data
FHE.allow(encryptedValue, userAddress);
```

#### Transient Permissions

```solidity
// Temporary access for operation
FHE.allowTransient(encryptedValue, address(this));
```

### Common Patterns

#### Pattern 1: Immediate Encryption

```solidity
function storeData(uint8 _value) external {
    // ✓ Encrypt immediately
    euint8 encrypted = FHE.asEuint8(_value);

    // Set permissions
    FHE.allowThis(encrypted);
    FHE.allow(encrypted, msg.sender);

    // Store
    userData[msg.sender] = encrypted;
}
```

#### Pattern 2: Encrypted Aggregation

```solidity
function incrementCounter() external {
    // Add 1 to encrypted counter
    counter = FHE.add(counter, FHE.asEuint32(1));

    // Update permissions
    FHE.allowThis(counter);
}
```

#### Pattern 3: User Decryption Flow

```solidity
// User requests their encrypted data
function getMyEncryptedData() external view returns (euint8) {
    return userData[msg.sender];
}

// Off-chain: User decrypts using fhevm library
// See test files for examples
```

## Extending the Contract

### Adding New Encrypted Fields

1. **Add to struct:**
```solidity
struct VisitorProfile {
    // Existing fields...
    euint8 encryptedNewField;
}
```

2. **Update registration:**
```solidity
function registerVisitor(uint8 _age, uint8 _newField) external {
    euint8 encrypted = FHE.asEuint8(_newField);

    visitorProfiles[msg.sender] = VisitorProfile({
        // ... existing fields
        encryptedNewField: encrypted
    });

    FHE.allowThis(encrypted);
    FHE.allow(encrypted, msg.sender);
}
```

3. **Add tests:**
```typescript
it("should store new encrypted field", async function () {
    await contract.registerVisitor(25, 5);
    // Test assertions...
});
```

### Adding New Functions

1. **Define the function:**
```solidity
/// @notice New function description
/// @param _param Parameter description
function newFunction(uint32 _param) external {
    // Implementation
}
```

2. **Add access control:**
```solidity
function newFunction(uint32 _param) external onlyRegisteredVisitor {
    require(_param > 0, "Invalid parameter");
    // Implementation
}
```

3. **Add events:**
```solidity
event NewFunctionCalled(address indexed user, uint32 param);

function newFunction(uint32 _param) external {
    // Implementation
    emit NewFunctionCalled(msg.sender, _param);
}
```

4. **Write tests:**
```typescript
describe("New Function", function () {
    it("should execute successfully", async function () {
        await contract.newFunction(123);
        // Assertions
    });

    it("should emit event", async function () {
        await expect(contract.newFunction(123))
            .to.emit(contract, "NewFunctionCalled")
            .withArgs(signers.alice.address, 123);
    });
});
```

### Adding New Exhibition Types

1. **Update enum:**
```solidity
enum ExhibitionType {
    History,
    Art,
    Science,
    Culture,
    Technology,
    Nature,
    NewType  // Add here
}
```

2. **Update documentation:**
```typescript
/**
 * ExhibitionType enum values:
 * 0: History
 * 1: Art
 * ...
 * 6: NewType
 */
```

3. **Test the new type:**
```typescript
it("should support new exhibition type", async function () {
    await contract.createExhibition("New", 6, startDate, endDate);
    // Assertions
});
```

## Testing

### Test Structure

```typescript
describe("Feature Suite", function () {
    let signers: Signers;
    let contract: PrivateMuseumVisitTracker;

    before(async function () {
        // One-time setup
    });

    beforeEach(async function () {
        // Per-test setup
    });

    it("should test behavior", async function () {
        // Test implementation
    });
});
```

### Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- test/PrivateMuseumVisitTracker.ts

# With grep pattern
npm test -- --grep "Registration"

# With coverage
npm run coverage
```

### Writing Effective Tests

1. **Use descriptive names:**
```typescript
// ✓ Good
it("should prevent duplicate visitor registration", ...)

// ✗ Bad
it("should work", ...)
```

2. **Test one thing:**
```typescript
// ✓ Good
it("should encrypt age", ...)
it("should emit VisitorRegistered event", ...)

// ✗ Bad (testing multiple things)
it("should register visitor and emit event and update count", ...)
```

3. **Use arrange-act-assert:**
```typescript
it("should do something", async function () {
    // Arrange
    const age = 25;

    // Act
    await contract.registerVisitor(age);

    // Assert
    const [registered] = await contract.getMyStats();
    expect(registered).to.be.true;
});
```

## Deployment

### Local Network

```bash
# Terminal 1: Start local node
npm run chain

# Terminal 2: Deploy
npm run deploy:localhost
```

### Sepolia Testnet

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

### Custom Deployment Scripts

Create `deploy/02-custom-deploy.ts`:

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("CustomContract", {
        from: deployer,
        args: [],
        log: true,
    });
};

deployFunction.tags = ["CustomContract"];
export default deployFunction;
```

## Documentation

### Generating Documentation

```bash
# Generate all documentation
npx ts-node scripts/generate-docs.ts
```

### Updating Documentation

1. **Add JSDoc comments to code:**
```typescript
/**
 * @title Test Description
 * @notice What this test does
 * @dev Additional technical details
 *
 * @chapter: access-control
 */
it("should test something", ...)
```

2. **Run documentation generator:**
```bash
npx ts-node scripts/generate-docs.ts
```

3. **Review generated files in `docs/`**

### Manual Documentation

Update these files manually:
- `README.md` - Project overview
- `DEVELOPER_GUIDE.md` - This file
- `docs/getting-started.md` - Getting started guide

## Best Practices

### Smart Contract

1. **Always encrypt sensitive data**
2. **Set permissions explicitly**
3. **Use appropriate encrypted types**
4. **Validate inputs before encryption**
5. **Document all functions with NatSpec**
6. **Emit events for important state changes**
7. **Use modifiers for access control**

### Testing

1. **Aim for >95% coverage**
2. **Test happy paths and error cases**
3. **Use descriptive test names**
4. **Test with multiple users**
5. **Verify gas usage**

### Code Organization

1. **Group related functions**
2. **Use consistent naming**
3. **Keep functions focused**
4. **Comment complex logic**
5. **Follow Solidity style guide**

### Security

1. **Never store unencrypted sensitive data**
2. **Validate all inputs**
3. **Check return values**
4. **Use safe math operations**
5. **Follow checks-effects-interactions pattern**

## Troubleshooting

### Common Issues

#### Compilation Fails

```bash
# Clean and recompile
npm run clean
npm run compile
```

#### Tests Fail

```bash
# Check FHEVM mock is available
if (!fhevm.isMock) {
    this.skip();
}
```

#### Type Errors

```bash
# Regenerate TypeChain types
npm run typechain
```

#### Deployment Issues

```bash
# Check network configuration
npx hardhat node --network localhost

# Verify account has funds
npx hardhat accounts --network sepolia
```

### Getting Help

- [Zama Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama Discord](https://discord.com/invite/zama)
- [GitHub Issues](https://github.com/zama-ai/fhevm/issues)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

### Code Review Checklist

- [ ] Tests pass
- [ ] Coverage maintained or improved
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] No sensitive data exposed
- [ ] Gas usage optimized
- [ ] Events emitted appropriately
- [ ] Error messages clear

---

**Happy Building!**

For questions or suggestions, open an issue on GitHub.
