# Getting Started

## Introduction

The Private Museum Visit Tracker demonstrates how to build privacy-preserving applications using Fully Homomorphic Encryption (FHE) on Ethereum. This guide will help you set up the project and understand its core features.

## What is FHEVM?

FHEVM (Fully Homomorphic Encryption for Ethereum Virtual Machine) allows you to perform computations on encrypted data without decrypting it. This enables:

- **Privacy-preserving smart contracts** - Keep user data confidential on-chain
- **Confidential transactions** - Process sensitive information securely
- **Zero-knowledge analytics** - Derive insights without exposing individual data

## Installation

### Prerequisites

Ensure you have the following installed:
- Node.js >= 20.0.0
- npm >= 7.0.0
- Git

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd PrivateMuseumVisitTracker

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file for network configuration (optional for local testing):

```bash
MNEMONIC="your mnemonic here"
INFURA_API_KEY="your infura api key"
ETHERSCAN_API_KEY="your etherscan api key"
```

**Note:** For local testing, these are not required.

## Quick Start

### 1. Compile Contracts

```bash
npm run compile
```

This compiles the Solidity contract and generates TypeScript types.

### 2. Run Tests

```bash
npm test
```

The test suite demonstrates all contract features:
- Visitor registration with encrypted age
- Exhibition creation and management
- Private visit recording with encrypted feedback
- Access control mechanisms
- Privacy-preserving statistics

### 3. Deploy Locally

```bash
# Start local Hardhat network (in separate terminal)
npm run chain

# Deploy contract
npm run deploy:localhost
```

### 4. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

## Project Structure

```
PrivateMuseumVisitTracker/
├── contracts/
│   └── PrivateMuseumVisitTracker.sol    # Main contract
├── test/
│   └── PrivateMuseumVisitTracker.ts     # Test suite
├── deploy/
│   └── 01-deploy-contract.ts            # Deployment script
├── scripts/
│   └── generate-docs.ts                 # Documentation generator
├── docs/
│   └── *.md                             # Documentation files
├── hardhat.config.ts                    # Hardhat configuration
├── tsconfig.json                        # TypeScript config
└── package.json                         # Dependencies
```

## Core Features

### 1. Encrypted Visitor Registration

Visitors register with their age, which is immediately encrypted:

```typescript
// Register with age 25
await contract.registerVisitor(25);
```

The age is:
- Encrypted using FHE.asEuint8()
- Categorized into age groups (Child, Teen, Adult, Senior)
- Stored securely on-chain
- Never exposed in plaintext

### 2. Private Visit Recording

Visitors can record exhibition visits with encrypted feedback:

```typescript
await contract.recordPrivateVisit(
  1,      // Exhibition ID
  8,      // Satisfaction (1-10)
  120,    // Duration in minutes
  4       // Interest level (1-5)
);
```

All parameters are encrypted before storage.

### 3. Access Control

The contract uses FHE.allow patterns to control data access:

```solidity
// Allow contract to access its own data
FHE.allowThis(encryptedAge);

// Allow user to decrypt their own data
FHE.allow(encryptedAge, msg.sender);
```

### 4. Privacy-Preserving Statistics

Museums can request aggregated statistics without accessing individual data:

```typescript
// Public statistics (non-sensitive)
const [totalExhibitions, totalVisitors] = await contract.getPublicStats();

// Request encrypted statistics (museum manager only)
await contract.requestExhibitionStats(exhibitionId);
```

## Understanding the Code

### Smart Contract

The contract (`contracts/PrivateMuseumVisitTracker.sol`) demonstrates:

1. **Encrypted Types:**
   - `euint8` for ages and ratings
   - `euint32` for counters and timestamps

2. **FHE Operations:**
   - `FHE.asEuint8()` / `FHE.asEuint32()` - Encrypt values
   - `FHE.add()` - Add encrypted values
   - `FHE.allowThis()` / `FHE.allow()` - Set access permissions

3. **Access Control:**
   - `onlyOwner` - Owner-only functions
   - `onlyMuseumManager` - Manager-only functions
   - `onlyRegisteredVisitor` - Visitor-only functions

### Tests

The test suite (`test/PrivateMuseumVisitTracker.ts`) covers:

- Contract deployment and initialization
- Visitor registration flow
- Exhibition management
- Visit recording with validation
- Access control enforcement
- Privacy guarantees
- Edge cases and error handling

## Next Steps

1. **Explore the contract** - Read `contracts/PrivateMuseumVisitTracker.sol`
2. **Run the tests** - See `test/PrivateMuseumVisitTracker.ts`
3. **Read the documentation** - Check out the [API Reference](api-reference.md)
4. **Learn FHEVM concepts** - See [FHEVM Concepts](fhevm-concepts.md)
5. **Build your own** - Extend the contract with new features

## Common Tasks

### Add a New Feature

1. Update the contract in `contracts/`
2. Add tests in `test/`
3. Run tests: `npm test`
4. Update documentation
5. Deploy: `npm run deploy:localhost`

### Generate Documentation

```bash
npx ts-node scripts/generate-docs.ts
```

This reads code comments and generates markdown documentation.

### Verify Contract

After deploying to Sepolia:

```bash
npm run verify:sepolia
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama Discord](https://discord.com/invite/zama)
- [Example Implementation](https://github.com/zama-ai/fhevm-hardhat-template)

## Troubleshooting

### Tests Fail on Sepolia

The test suite requires a mock FHEVM environment:

```typescript
if (!fhevm.isMock) {
  console.warn(`This test suite cannot run on Sepolia`);
  this.skip();
}
```

For Sepolia testing, deploy the contract and interact via scripts.

### Compilation Errors

Ensure you're using Solidity 0.8.24:

```json
{
  "solidity": {
    "version": "0.8.24"
  }
}
```

### Type Generation Issues

Regenerate types:

```bash
npm run clean
npm run compile
```

---

Ready to build privacy-preserving applications! Check out the [API Reference](api-reference.md) for detailed function documentation.
