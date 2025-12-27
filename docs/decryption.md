# Decryption Flows

## Overview

Decryption is the process of revealing encrypted data to authorized parties. This chapter covers both user and public decryption patterns used in the Private Museum Visit Tracker.

## User Decryption

Users can decrypt data that has been authorized for them.

### Pattern: User-Owned Data

Individual users decrypt their own encrypted data:

```solidity
// Contract stores encrypted data with user permission
function registerVisitor(uint8 _age) external {
    euint8 encryptedAge = FHE.asEuint8(_age);

    // User can decrypt their own data
    FHE.allow(encryptedAge, msg.sender);
    FHE.allowThis(encryptedAge);

    visitorProfiles[msg.sender] = VisitorProfile({
        encryptedAge: encryptedAge,
        // ...
    });
}
```

### User Decryption in Tests

The test suite demonstrates user decryption patterns:

```typescript
it("should support user decryption", async function () {
  // Create encrypted input
  const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, signers.alice.address)
    .add8(25)
    .encrypt();

  // Use in contract
  await contract.connect(signers.alice).registerVisitor(
    encryptedInput.handles[0],
    encryptedInput.inputProof
  );

  // User can now decrypt their data
  // In a real scenario, this would happen off-chain
  const decrypted = await fhevm.userDecryptEuint8(
    FhevmType.euint8,
    encryptedValue,
    contractAddress,
    signers.alice
  );

  expect(decrypted).to.equal(25);
});
```

## Public Decryption

Public decryption allows authorized parties (like museum managers) to decrypt aggregate data.

### Pattern: Request-Response Flow

1. **Request:** Manager requests decryption of aggregate statistics
2. **Off-chain:** Decryption happens outside the contract
3. **Response:** Results are returned to the contract

### Implementation in Contract

```solidity
function requestExhibitionStats(uint32 _exhibitionId) external onlyMuseumManager {
    require(_exhibitionId > 0 && _exhibitionId <= totalExhibitions, "Invalid exhibition");

    // Prepare encrypted values for decryption
    bytes32[] memory cts = new bytes32[](2);
    cts[0] = FHE.toBytes32(exhibitions[_exhibitionId].privateVisitorCount);
    cts[1] = FHE.toBytes32(exhibitions[_exhibitionId].privateSatisfactionSum);

    // Request off-chain decryption
    FHE.requestDecryption(cts, this.processStatsReveal.selector);

    emit StatisticsRequested(_exhibitionId, msg.sender);
}
```

### Handling Decryption Results

```solidity
function processStatsReveal(
    uint256 requestId,
    uint32 visitorCount,
    uint32 satisfactionSum
) external {
    // Now we have decrypted values
    // Museum manager can see aggregated stats without individual data

    // Example: Calculate average satisfaction
    uint32 averageSatisfaction = visitorCount > 0
        ? satisfactionSum / visitorCount
        : 0;

    // Use decrypted statistics
    // Note: This example is simplified; production code would emit events
}
```

## Decryption Workflows

### Workflow 1: User Checks Own Data

```
1. User calls getMyStats()
2. Returns encrypted data (if applicable)
3. Off-chain: User decrypts using fhevm library
4. User sees their personal data
```

```typescript
// Step 1 & 2: Get encrypted data
const encrypted = await contract.getMyEncryptedData();

// Step 3 & 4: Off-chain decryption
const decrypted = await fhevm.userDecryptEuint32(
    FhevmType.euint32,
    encrypted,
    contractAddress,
    userSigner
);
```

### Workflow 2: Manager Requests Statistics

```
1. Manager calls requestExhibitionStats()
2. Contract prepares encrypted values
3. FHE.requestDecryption() is called
4. Off-chain decryption happens
5. processStatsReveal() receives results
6. Decrypted statistics available for analysis
```

```typescript
// Step 1: Request statistics
await contract.connect(managerSigner).requestExhibitionStats(exhibitionId);

// Steps 2-4: Automatic off-chain processing

// Step 5-6: Results processed by contract
// (In production, contract would emit event or store results)
```

## Access Control in Decryption

### Who Can Decrypt What?

```solidity
// Encrypted Data → Permissions → Who Can Decrypt
encryptedAge → FHE.allow(age, user) → Only that user
privateSatisfaction → FHE.allowThis() → Only contract
publicStats → FHE.requestDecryption() → Authorized manager
```

### Permission Patterns

#### User-Only Decryption
```solidity
euint8 encryptedAge = FHE.asEuint8(_age);
FHE.allow(encryptedAge, msg.sender);  // Only this user can decrypt
```

#### Contract-Only Decryption
```solidity
euint32 encryptedCounter = FHE.asEuint32(1);
FHE.allowThis(encryptedCounter);  // Only contract can decrypt if needed
```

#### Manager Decryption (via request)
```solidity
FHE.requestDecryption(
    cts,
    this.processStatsReveal.selector  // Only this function can process
);
```

## Common Decryption Patterns

### Pattern 1: Aggregate Statistics

Decrypt only aggregate/anonymized data:

```solidity
// Encrypt individual data
privateSatisfactionSum = FHE.add(privateSatisfactionSum, FHE.asEuint32(rating));

// Later: Request decryption of aggregated sum
FHE.requestDecryption(
    abi.encodePacked(privateSatisfactionSum),
    this.processAverageReveal.selector
);

// Callback computes average
function processAverageReveal(uint256 requestId, uint32 satisfactionSum) external {
    uint32 average = satisfactionSum / visitorCount;
    // Use average for insights without exposing individual ratings
}
```

### Pattern 2: Conditional Decryption

Decrypt only when specific conditions are met:

```solidity
function revealStatsIfThreshold(uint32 _exhibitionId) external onlyManager {
    Exhibition storage exhibition = exhibitions[_exhibitionId];

    // Only request decryption if visitor count is above threshold
    if (FHE.publicKeyCiphertext(exhibition.publicVisitorCount) > 10) {
        FHE.requestDecryption(
            abi.encodePacked(exhibition.privateSatisfactionSum),
            this.processThresholdReveal.selector
        );
    }
}
```

### Pattern 3: Time-Based Decryption

Decrypt after a certain time period:

```solidity
mapping(uint256 => uint32) public decryptionRequestTimestamps;

function requestDelayedDecryption(uint32 _exhibitionId) external {
    decryptionRequestTimestamps[_exhibitionId] = uint32(block.timestamp);

    // Decryption request prepared but not processed yet
    // Could implement logic to process after delay
}

function processIfReady(uint32 _exhibitionId) external {
    require(
        block.timestamp >= decryptionRequestTimestamps[_exhibitionId] + 1 days,
        "Must wait 1 day"
    );

    // Now request decryption
    FHE.requestDecryption(
        abi.encodePacked(exhibitions[_exhibitionId].privateSatisfactionSum),
        this.processReveal.selector
    );
}
```

## Privacy Considerations

### What Decryption Reveals

✓ **Aggregate statistics** - Total counts, averages (okay to decrypt)
✓ **User's own data** - Their personal information (okay for user)
✓ **Anonymized results** - Statistics that don't identify individuals (okay)

✗ **Individual data** - Specific person's rating (should not decrypt)
✗ **Identifiable information** - Patterns that reveal identity (avoid)
✗ **Cross-user data** - Other users' information (never decrypt)

### Best Practices

1. **Decrypt minimally** - Only decrypt what's necessary
2. **Aggregate first** - Compute on encrypted data before decrypting
3. **Check permissions** - Verify who is requesting decryption
4. **Log events** - Emit events when decryption is requested
5. **Use callbacks** - Process results in designated callback functions

## Testing Decryption

### Test User Decryption

```typescript
it("should allow users to decrypt their data", async function () {
  // Register with encrypted age
  const age = 25;
  await contract.connect(signers.alice).registerVisitor(age);

  // Verify user can see they're registered
  const [isRegistered, date] = await contract.connect(signers.alice).getMyStats();
  expect(isRegistered).to.be.true;
});
```

### Test Manager Decryption Request

```typescript
it("should allow manager to request statistics decryption", async function () {
  // Add some visits first
  await contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4);

  // Manager requests decryption
  await expect(contract.connect(signers.deployer).requestExhibitionStats(1))
    .to.emit(contract, "StatisticsRequested")
    .withArgs(1, signers.deployer.address);
});
```

### Test Access Control

```typescript
it("should prevent unauthorized decryption requests", async function () {
  // Non-manager cannot request decryption
  await expect(
    contract.connect(signers.alice).requestExhibitionStats(1)
  ).to.be.revertedWith("Not museum manager");
});
```

## Summary

Decryption in FHEVM:

1. **User Decryption** - Authorized individuals decrypt their own data
2. **Public Decryption** - Aggregate data decrypted for analysis
3. **Access Control** - Permissions enforce who can decrypt what
4. **Privacy Preservation** - Individual data remains encrypted
5. **Selective Revealing** - Only necessary data is decrypted

The Private Museum Visit Tracker demonstrates both patterns:
- **User level:** Visitors can check their registration status
- **Manager level:** Managers can request aggregate statistics

---

Next: Learn about [Statistics Aggregation](statistics-aggregation.md) to understand how encrypted data is combined for insights.
