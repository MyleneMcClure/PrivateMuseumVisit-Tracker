# Privacy Patterns

## Overview

Privacy patterns are proven approaches to building confidential applications using FHEVM. This chapter explores patterns demonstrated in the Private Museum Visit Tracker.

## Core Privacy Patterns

### Pattern 1: Selective Encryption

Only encrypt sensitive data. Leave non-sensitive data public for efficiency.

```solidity
// Selective encryption strategy
struct Exhibition {
    string name;                    // ✓ Public - non-sensitive
    ExhibitionType exhibitionType;  // ✓ Public - non-sensitive
    uint32 startDate;               // ✓ Public - non-sensitive
    uint32 endDate;                 // ✓ Public - non-sensitive
    euint32 privateVisitorCount;    // ✗ Encrypted - sensitive aggregate
    euint32 privateSatisfactionSum; // ✗ Encrypted - sensitive aggregate
}
```

**Benefits:**
- Lower gas costs (fewer FHE operations)
- Better performance (less encryption overhead)
- Maintained privacy where it matters

**When to use:**
- Mixed public/private data
- Cost-sensitive applications
- Analytics with aggregate privacy

### Pattern 2: Data Aggregation Before Decryption

Compute statistics on encrypted data. Decrypt only final results.

```solidity
// Add encrypted values without decryption
exhibitions[id].privateVisitorCount = FHE.add(
    exhibitions[id].privateVisitorCount,
    FHE.asEuint32(1)
);

exhibitions[id].privateSatisfactionSum = FHE.add(
    exhibitions[id].privateSatisfactionSum,
    FHE.asEuint32(satisfaction)
);

// Later: Request decryption of aggregate sum only
FHE.requestDecryption(
    abi.encodePacked(exhibitions[id].privateSatisfactionSum),
    this.processAverageReveal.selector
);

// Calculate average from decrypted sum
function processAverageReveal(uint256 requestId, uint32 sum) external {
    uint32 average = sum / visitorCount;
    // Never decrypt individual ratings, only the aggregate
}
```

**Benefits:**
- Individual data never decrypted
- Aggregates reveal insights
- Privacy mathematically guaranteed

**When to use:**
- Analytics and reporting
- Aggregate statistics
- Privacy-critical applications

### Pattern 3: User-Owned Encrypted Data

Each user's sensitive data is encrypted and only they can decrypt it.

```solidity
struct UserData {
    euint8 encryptedAge;
    euint8 encryptedPreference;
}

mapping(address => UserData) public userData;

function registerUser(uint8 _age, uint8 _preference) external {
    euint8 encryptedAge = FHE.asEuint8(_age);
    euint8 encryptedPref = FHE.asEuint8(_preference);

    // Only this user can decrypt
    FHE.allow(encryptedAge, msg.sender);
    FHE.allow(encryptedPref, msg.sender);

    // Contract needs access for operations
    FHE.allowThis(encryptedAge);
    FHE.allowThis(encryptedPref);

    userData[msg.sender] = UserData({
        encryptedAge: encryptedAge,
        encryptedPreference: encryptedPref
    });
}
```

**Benefits:**
- Users control their own data
- No one can access user data without permission
- Users can audit their own encrypted data

**When to use:**
- Personal information protection
- User preference storage
- Authentication data

### Pattern 4: Hierarchical Access Control

Different data access levels for different roles.

```solidity
// Visitor data - encrypted, user-only access
euint8 visitorAge = FHE.asEuint8(_age);
FHE.allow(visitorAge, visitorAddress);

// Manager statistics - can request aggregate decryption
FHE.requestDecryption(
    cts,
    this.processManagerStats.selector
);

// Owner-only critical data - highest protection
euint32 criticalValue = FHE.asEuint32(_value);
FHE.allowThis(criticalValue);  // Only contract
// Don't call FHE.allow() - no one can decrypt
```

**Levels:**
1. **Public:** Non-encrypted, everyone can see
2. **User:** Encrypted, user can decrypt
3. **Manager:** Aggregate encrypted, manager can request decryption
4. **Owner:** Encrypted, only contract uses

**When to use:**
- Multi-role systems
- Mixed permission requirements
- Complex privacy models

### Pattern 5: Privacy-Preserving Analytics

Derive insights from encrypted data without exposing individuals.

```solidity
// Step 1: Collect encrypted feedback
function recordFeedback(uint8 _rating) external {
    euint8 encrypted = FHE.asEuint8(_rating);
    feedbackSum = FHE.add(feedbackSum, FHE.asEuint32(_rating));
    feedbackCount++;  // Keep count plaintext
}

// Step 2: Compute on encrypted data
// Average satisfaction = encrypted sum / plaintext count

// Step 3: Request decryption of result only
FHE.requestDecryption(feedbackSum, this.revealAverage.selector);

// Step 4: Use decrypted aggregate
function revealAverage(uint256 requestId, uint32 sum) external {
    uint32 average = sum / feedbackCount;
    emit AverageCalculated(average);
    // Individual ratings never exposed
}
```

**Benefits:**
- Insights from sensitive data
- Individual privacy maintained
- Useful for decision-making

**When to use:**
- Analytics dashboards
- Trend analysis
- Business intelligence

## Advanced Patterns

### Pattern 6: Encrypted Conditional Logic

Make decisions based on encrypted values.

```solidity
function processIfThreshold(euint32 encryptedValue) external {
    euint32 threshold = FHE.asEuint32(THRESHOLD);

    // Compare encrypted values
    ebool isAboveThreshold = FHE.gt(encryptedValue, threshold);

    // Use encrypted boolean in conditional
    euint32 result = FHE.select(
        isAboveThreshold,
        rewardAmount,
        0
    );

    // Process based on encrypted comparison
    // Actual condition stays hidden
}
```

**Use cases:**
- Conditional rewards
- Threshold-based actions
- Privacy-preserving policies

### Pattern 7: Progressive Decryption

Decrypt data gradually or conditionally.

```solidity
function requestPartialDecryption(uint32 _aggregateSize) external onlyManager {
    require(_aggregateSize >= MIN_AGGREGATE_SIZE, "Too small");

    // Only decrypt if aggregate is large enough
    FHE.requestDecryption(
        aggregateData,
        this.processDecrypted.selector
    );
}

function processDecrypted(uint256 requestId, uint32 value) external {
    require(isAggregateValid(value), "Invalid aggregate");
    // Use decrypted value
}
```

**Use cases:**
- Differential privacy
- Controlled information release
- Gradual analysis

### Pattern 8: Encrypted Audit Trail

Maintain privacy while preserving auditability.

```solidity
struct AuditEntry {
    address actor;
    uint256 timestamp;
    euint32 encryptedValue;  // What happened stays private
}

mapping(uint256 => AuditEntry) public auditLog;

function recordAction(euint32 encryptedData) external {
    uint256 id = auditLogCount++;

    auditLog[id] = AuditEntry({
        actor: msg.sender,
        timestamp: block.timestamp,
        encryptedValue: encryptedData
    });

    FHE.allowThis(encryptedData);
    // Manager can verify action was taken
    // But content stays encrypted
}
```

**Benefits:**
- Accountability without exposure
- Auditability with privacy
- Compliance with regulations

## Anti-Patterns (What NOT to Do)

### ❌ Anti-Pattern 1: Decrypting Too Much

```solidity
// ✗ Bad - exposes individual data
function exposeAllData(address _user) external onlyManager {
    // Requesting decryption of individual ratings
    FHE.requestDecryption(
        userRatings[_user],  // BAD: Individual data
        this.reveal.selector
    );
}

// ✓ Good - decrypt only aggregates
function getStatistics() external onlyManager {
    FHE.requestDecryption(
        totalRatingSum,      // GOOD: Aggregate only
        this.revealAverage.selector
    );
}
```

### ❌ Anti-Pattern 2: Storing Plaintext Before Encryption

```solidity
// ✗ Bad - plaintext exposure window
function storeValue(uint32 _value) external {
    uint32 temp = _value;        // ✗ Plaintext copy
    euint32 encrypted = FHE.asEuint32(temp);
    data[msg.sender] = encrypted;
}

// ✓ Good - immediate encryption
function storeValue(uint32 _value) external {
    euint32 encrypted = FHE.asEuint32(_value);
    data[msg.sender] = encrypted;
}
```

### ❌ Anti-Pattern 3: Missing Access Control

```solidity
// ✗ Bad - no access control
euint32 encrypted = FHE.asEuint32(value);
userData[msg.sender] = encrypted;
// Anyone could potentially decrypt if allowed!

// ✓ Good - explicit access control
euint32 encrypted = FHE.asEuint32(value);
FHE.allow(encrypted, msg.sender);      // User only
FHE.allowThis(encrypted);               // Contract only
userData[msg.sender] = encrypted;
```

### ❌ Anti-Pattern 4: View Functions with Encrypted Returns

```solidity
// ✗ Bad - can't actually decrypt in view function
function getEncryptedData() external view returns (euint32) {
    return userData[msg.sender].encrypted;  // User can't use this
}

// ✓ Good - provide only checkable status
function isDataSet() external view returns (bool) {
    return userData[msg.sender].isSet;  // Clear public interface
}
```

## Privacy Checklist

When designing a privacy-preserving contract:

- [ ] Identify sensitive data
- [ ] Plan encryption strategy (all vs. selective)
- [ ] Design access control model
- [ ] Plan decryption flow (when and how)
- [ ] Consider data aggregation approach
- [ ] Prevent plaintext leaks
- [ ] Test with multiple users
- [ ] Verify no unintended decryption
- [ ] Document privacy model
- [ ] Consider differential privacy needs

## Privacy by Design

The Private Museum Visit Tracker follows privacy by design principles:

1. **Data Minimization**
   - Only collect necessary data
   - Age in categories, not exact
   - Aggregate statistics preferred

2. **Purpose Limitation**
   - Data used only for analytics
   - No sharing with third parties
   - Clear usage policies

3. **Storage Limitation**
   - Encrypted on-chain
   - No plaintext backups
   - Immutable audit trail

4. **Access Control**
   - Users access own data
   - Managers see aggregates only
   - Role-based permissions

5. **Transparency**
   - Clear privacy policies
   - Visible encryption in code
   - Auditable operations

## Summary

Privacy patterns in FHEVM:

1. **Selective Encryption** - Encrypt only sensitive data
2. **Data Aggregation** - Compute on encrypted, decrypt aggregates
3. **User Ownership** - Each user controls their data
4. **Hierarchical Access** - Different roles, different access
5. **Privacy Analytics** - Insights without exposure
6. **Conditional Logic** - Decisions on encrypted conditions
7. **Progressive Decryption** - Controlled information release
8. **Encrypted Audit** - Accountability with privacy

Combining these patterns creates robust, privacy-preserving applications.

---

Next: Learn about [Troubleshooting](../docs/faq.md) for common issues and solutions.
