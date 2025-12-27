# Testing Guide

Comprehensive guide to testing the Private Museum Visit Tracker smart contract.

## Overview

The test suite covers:
- Contract deployment and initialization
- Visitor registration with encryption
- Exhibition management
- Visit recording and validation
- Access control enforcement
- Privacy guarantees
- Edge cases and error handling

**Total Test Cases:** 25+

## Running Tests

### Local Network Tests

```bash
npm test
```

This runs the full test suite against the Hardhat mock FHEVM environment. Best for development and quick feedback.

### Sepolia Testnet Tests

```bash
npm run test:sepolia
```

Runs tests against Sepolia network with real FHEVM support. Requires network configuration and testnet funds.

### Verbose Output

```bash
npm test -- --verbose
```

Shows detailed output for each test.

### Specific Test File

```bash
npm test -- test/PrivateMuseumVisitTracker.ts
```

### Specific Test Suite

```bash
npm test -- --grep "Visitor Registration"
```

## Test Structure

Tests are organized into logical suites:

### 1. Contract Deployment (2 tests)
- Verify correct initial state
- Check deployer assignments

### 2. Museum Manager Management (2 tests)
- Set new manager
- Reject unauthorized manager changes

### 3. Visitor Registration (5 tests)
- Successful registration
- Prevent duplicate registration
- Validate age requirements
- Age group categorization
- Event emission

### 4. Exhibition Management (5 tests)
- Create exhibitions
- Validate date ranges
- Manager-only enforcement
- Event emission
- Status toggling

### 5. Private Visit Recording (7 tests)
- Record private visits
- Require visitor registration
- Prevent duplicate visits
- Validate satisfaction ratings
- Validate interest levels
- Reject inactive exhibitions
- Event emissions

### 6. Statistics and Privacy (3 tests)
- Public statistics correctness
- Visitor count tracking
- Manager-only statistics access
- Visitor privacy maintenance

### 7. Access Control (3 tests)
- Owner-only functions
- Manager-only functions
- Visitor-only functions

### 8. Edge Cases (2+ tests)
- Invalid exhibition IDs
- High visitor counts
- Boundary conditions

## Writing New Tests

### Test Template

```typescript
describe("Feature Name", function () {
  let signers: Signers;
  let contract: PrivateMuseumVisitTracker;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1] };
  });

  beforeEach(async function () {
    // Skip if not on mock FHEVM
    if (!fhevm.isMock) {
      this.skip();
    }

    // Deploy contract
    const factory = await ethers.getContractFactory("PrivateMuseumVisitTracker");
    contract = await factory.deploy();
  });

  it("should test specific behavior", async function () {
    // Arrange
    const input = "test_value";

    // Act
    const result = await contract.someFunction(input);

    // Assert
    expect(result).to.equal("expected_value");
  });

  it("should emit event", async function () {
    await expect(contract.someFunction("value"))
      .to.emit(contract, "EventName")
      .withArgs("expected_arg");
  });

  it("should reject invalid input", async function () {
    await expect(contract.someFunction("invalid"))
      .to.be.revertedWith("Error message");
  });
});
```

## Testing Patterns

### Testing Encryption

```typescript
it("should encrypt data immediately", async function () {
  await contract.registerVisitor(25);

  // Cannot read encrypted value directly
  // But can check registration status
  const [isRegistered] = await contract.getMyStats();
  expect(isRegistered).to.be.true;
});
```

### Testing Access Control

```typescript
it("should enforce access control", async function () {
  // Setup: create exhibition as manager
  await contract.createExhibition("Test", 0, startDate, endDate);

  // Test: non-manager cannot create
  await expect(
    contract.connect(signers.bob).createExhibition("Test2", 0, startDate, endDate)
  ).to.be.revertedWith("Not museum manager");
});
```

### Testing Events

```typescript
it("should emit correct events", async function () {
  const age = 25;

  await expect(contract.registerVisitor(age))
    .to.emit(contract, "VisitorRegistered")
    .withArgs(signers.alice.address, await ethers.provider.getBlock('latest').then(b => b?.timestamp));
});
```

### Testing Decryption

```typescript
it("should support user decryption", async function () {
  // Encrypt value
  const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, signers.alice.address)
    .add32(1)
    .encrypt();

  // Use in contract
  await contract.someFunction(encryptedInput.handles[0], encryptedInput.inputProof);

  // Decrypt result
  const decrypted = await fhevm.userDecryptEuint(
    FhevmType.euint32,
    encryptedValue,
    contractAddress,
    signers.alice
  );

  expect(decrypted).to.equal(expectedValue);
});
```

### Testing Multiple Actors

```typescript
it("should handle multiple visitors", async function () {
  // Register multiple visitors
  await contract.connect(signers.alice).registerVisitor(25);
  await contract.connect(signers.bob).registerVisitor(35);

  // Verify count
  const [, totalVisitors] = await contract.getPublicStats();
  expect(totalVisitors).to.equal(2);
});
```

## Debugging Tests

### Enable Logging

```typescript
it("should debug operation", async function () {
  console.log("Starting test");

  const result = await contract.someFunction();

  console.log("Result:", result);
  expect(result).to.be.true;
});
```

### Use Hardhat console

```typescript
import hre from "hardhat";

it("should use console", async function () {
  hre.hardhat.network.provider.send("hardhat_setLoggingEnabled", [true]);

  await contract.someFunction();

  hre.hardhat.network.provider.send("hardhat_setLoggingEnabled", [false]);
});
```

### Get Block Information

```typescript
it("should check block details", async function () {
  const block = await ethers.provider.getBlock('latest');
  console.log("Block number:", block?.number);
  console.log("Timestamp:", block?.timestamp);
});
```

## Test Coverage

Generate coverage report:

```bash
npm run coverage
```

This creates a `coverage/` directory with detailed coverage statistics.

### Coverage Goals

- **Statements:** > 95%
- **Branches:** > 90%
- **Functions:** > 95%
- **Lines:** > 95%

### Improving Coverage

To improve coverage:
1. Add tests for error conditions
2. Test all branches of conditionals
3. Test all function combinations
4. Test edge cases
5. Test with different user roles

## Performance Testing

### Gas Usage

The test suite logs gas usage for each operation. Check the output for:

```
registering visitor: 123456 gas
recording visit: 234567 gas
```

### Load Testing

Create multiple visitors and visits:

```typescript
it("should handle many visitors efficiently", async function () {
  for (let i = 1; i <= 100; i++) {
    const signer = (await ethers.getSigners())[i % 19 + 1];
    await contract.connect(signer).registerVisitor(20 + i);
  }

  const [, count] = await contract.getPublicStats();
  expect(count).to.equal(100);
});
```

## Continuous Integration

The test suite can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests Fail on Sepolia

Some tests are designed for the mock FHEVM environment and are skipped on Sepolia:

```typescript
beforeEach(async function () {
  if (!fhevm.isMock) {
    console.warn("Cannot run this test on Sepolia");
    this.skip();
  }
});
```

### Timeout Errors

Increase timeout for slow operations:

```typescript
it("should complete slow operation", async function () {
  this.timeout(10000); // 10 seconds

  const result = await contract.expensiveOperation();
  expect(result).to.be.true;
});
```

### Type Errors

Regenerate types after contract changes:

```bash
npm run clean
npm run compile
```

## Best Practices

1. **Clear test names** - Describe exactly what is being tested
2. **Setup/Teardown** - Use beforeEach/afterEach appropriately
3. **Single responsibility** - One assertion per test when possible
4. **No dependencies** - Tests should run independently
5. **Mock external data** - Use test fixtures consistently
6. **Descriptive assertions** - Use meaningful error messages
7. **DRY principle** - Extract common setup to helpers
8. **Performance testing** - Monitor gas usage
9. **Document edge cases** - Explain why edge cases matter
10. **Regular updates** - Keep tests in sync with contract changes

## Resources

- [Hardhat Testing Guide](https://hardhat.org/docs/guides/hardhat-testing)
- [Chai Assertion Library](https://www.chaijs.com/api/)
- [FHEVM Testing](https://docs.zama.ai/fhevm/getting-started/hardhat)

---

For more information, see the [API Reference](api-reference.md).
