# Encryption Basics

## Overview

Encryption is the foundation of privacy in the Private Museum Visit Tracker. This chapter covers how sensitive data is encrypted using FHEVM.

## What Gets Encrypted?

### Visitor Data

- **Age** - Encrypted as `euint8`
- **Age Group** - Encrypted categorization (Child, Teen, Adult, Senior)
- **Total Visits** - Encrypted counter as `euint32`

### Visit Data

- **Timestamp** - Encrypted as `euint32`
- **Satisfaction Rating** - Encrypted as `euint8` (1-10)
- **Visit Duration** - Encrypted as `euint32` (in minutes)
- **Interest Level** - Encrypted as `euint8` (1-5)

### Aggregate Statistics

- **Exhibition Visitor Count** - Encrypted as `euint32`
- **Exhibition Satisfaction Sum** - Encrypted as `euint32`
- **Type Visitor Counts** - Encrypted by exhibition type
- **Daily Visitor Counts** - Encrypted by date
- **Age Group Counts** - Encrypted by age group

## Encryption Types

### euint8 (8-bit Encrypted Unsigned Integer)

Used for small values that fit in 8 bits:
- Ages (0-255)
- Ratings (1-10)
- Interest levels (1-5)
- Age group enum values

**Example:**
```solidity
euint8 encryptedAge = FHE.asEuint8(_age);
euint8 encryptedRating = FHE.asEuint8(_satisfaction);
```

### euint32 (32-bit Encrypted Unsigned Integer)

Used for larger values:
- Timestamps
- Counters
- Visit durations
- Aggregate statistics

**Example:**
```solidity
euint32 encryptedTimestamp = FHE.asEuint32(uint32(block.timestamp));
euint32 encryptedDuration = FHE.asEuint32(_duration);
```

## Encryption Process

### Step 1: Create Encrypted Value

```solidity
// Encrypt plaintext value
euint8 encryptedAge = FHE.asEuint8(_age);
```

### Step 2: Set Access Permissions

```solidity
// Allow contract to access its own data
FHE.allowThis(encryptedAge);

// Allow user to access their own data
FHE.allow(encryptedAge, msg.sender);
```

### Step 3: Store on-chain

```solidity
visitorProfiles[msg.sender] = VisitorProfile({
    isRegistered: true,
    encryptedAge: encryptedAge,
    // ... other fields
});
```

## Examples from the Contract

### Visitor Registration

```solidity
function registerVisitor(uint8 _age) external {
    // Encrypt sensitive information
    euint8 encryptedAge = FHE.asEuint8(_age);
    euint8 encryptedAgeGroup = FHE.asEuint8(uint8(ageGroup));

    visitorProfiles[msg.sender] = VisitorProfile({
        isRegistered: true,
        encryptedAge: encryptedAge,
        encryptedAgeGroup: encryptedAgeGroup,
        totalVisits: FHE.asEuint32(0),
        registrationDate: uint32(block.timestamp)
    });

    // Set access permissions
    FHE.allowThis(encryptedAge);
    FHE.allow(encryptedAge, msg.sender);
}
```

### Visit Recording

```solidity
function recordPrivateVisit(
    uint32 _exhibitionId,
    uint8 _satisfaction,
    uint32 _duration,
    uint8 _interestLevel
) external onlyRegisteredVisitor {
    // Encrypt all personal data
    euint8 encryptedSatisfaction = FHE.asEuint8(_satisfaction);
    euint32 encryptedDuration = FHE.asEuint32(_duration);
    euint8 encryptedInterestLevel = FHE.asEuint8(_interestLevel);

    visitRecords[msg.sender][_exhibitionId] = PrivateVisitRecord({
        exhibitionId: _exhibitionId,
        encryptedTimestamp: FHE.asEuint32(uint32(block.timestamp)),
        encryptedSatisfaction: encryptedSatisfaction,
        encryptedDuration: encryptedDuration,
        encryptedInterestLevel: encryptedInterestLevel,
        isRecorded: true
    });

    // Set permissions
    FHE.allowThis(encryptedSatisfaction);
    FHE.allow(encryptedSatisfaction, msg.sender);
}
```

### Aggregate Statistics

```solidity
// Update encrypted visitor count
exhibitions[_exhibitionId].privateVisitorCount = FHE.add(
    exhibitions[_exhibitionId].privateVisitorCount,
    FHE.asEuint32(1)
);

// Update encrypted satisfaction sum
exhibitions[_exhibitionId].privateSatisfactionSum = FHE.add(
    exhibitions[_exhibitionId].privateSatisfactionSum,
    FHE.asEuint32(uint32(_satisfaction))
);
```

## Operations on Encrypted Data

### Adding Encrypted Values

```solidity
euint32 result = FHE.add(encryptedValue1, encryptedValue2);
```

This adds two encrypted values without decrypting them. The result is still encrypted.

### Comparing Encrypted Values

```solidity
ebool comparison = FHE.eq(encryptedValue1, encryptedValue2);
```

Compare encrypted values and get an encrypted boolean result.

## Access Control

### Allow Contract Access

```solidity
// Contract can decrypt when needed for operations
FHE.allowThis(encryptedValue);
```

### Allow User Access

```solidity
// Specific user can decrypt their own data
FHE.allow(encryptedValue, userAddress);
```

## Security Considerations

### 1. Immediate Encryption

Encrypt data immediately upon receipt:
```solidity
// ✓ Good
euint8 encrypted = FHE.asEuint8(_age);

// ✗ Bad - storing plaintext first
uint8 plainAge = _age;
euint8 encrypted = FHE.asEuint8(plainAge);
```

### 2. Set Correct Permissions

Always set permissions for encrypted data:
```solidity
euint8 encryptedValue = FHE.asEuint8(value);
FHE.allowThis(encryptedValue);  // Allow contract access
FHE.allow(encryptedValue, msg.sender);  // Allow user access
```

### 3. Avoid Plaintext Comparison

Never compare plaintext with encrypted values:
```solidity
// ✗ Bad - mixes plaintext and encrypted
if (_plainValue > encryptedValue) { ... }

// ✓ Good - use FHE comparison
ebool result = FHE.gt(encryptedValue, FHE.asEuint32(_plainValue));
```

## Best Practices

1. **Encrypt early** - Encrypt data as soon as received
2. **Set permissions explicitly** - Always call FHE.allowThis and FHE.allow
3. **Use appropriate types** - Use euint8 for small values, euint32 for large
4. **Keep keys secure** - The blockchain is immutable but not private
5. **Audit thoroughly** - Review all encryption and access patterns

## Testing Encryption

The test suite demonstrates encryption patterns:

```typescript
it("should register visitor with encrypted age", async function () {
  const age = 25;
  const tx = await contract.connect(signers.alice).registerVisitor(age);
  await tx.wait();

  const [isRegistered] = await contract.connect(signers.alice).getMyStats();
  expect(isRegistered).to.be.true;
});
```

## Summary

Encryption in FHEVM:
- Protects sensitive data on-chain
- Enables computation without decryption
- Requires explicit access control
- Uses euint8 and euint32 types
- Must be applied immediately to user input

---

Next: Learn about [Access Control](access-control.md) to understand how permissions work with encrypted data.
