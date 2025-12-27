# Statistics Aggregation

## Overview

Statistics aggregation is the process of combining encrypted data to derive insights without exposing individual records. This chapter explains how the Private Museum Visit Tracker computes meaningful statistics while preserving privacy.

## Key Concept

**Traditional Approach:**
```
Individual Data (Encrypted)
  ↓ (Decrypt - reveals all data)
Individual Data (Plaintext)
  ↓ (Compute statistics)
Aggregated Results
```

**FHEVM Approach:**
```
Individual Data (Encrypted)
  ↓ (Compute on encrypted data)
Encrypted Aggregates
  ↓ (Decrypt aggregate only)
Aggregated Results (No individual data ever visible)
```

## Encrypted Aggregation in the Contract

### Visitor Count Aggregation

```solidity
// Start with zero
euint32 visitorCount = FHE.asEuint32(0);

// For each visit, increment while encrypted
function recordPrivateVisit(...) external {
    exhibitions[exhibitionId].privateVisitorCount = FHE.add(
        exhibitions[exhibitionId].privateVisitorCount,
        FHE.asEuint32(1)
    );
}

// Later: Request decryption of final count
FHE.requestDecryption(
    abi.encodePacked(visitorCount),
    this.processVisitorCount.selector
);
```

**Privacy Guarantee:** Individual visitor identities never appear in plaintext. Only the final count is decrypted.

### Satisfaction Sum Aggregation

```solidity
// Track sum of all satisfaction ratings
euint32 satisfactionSum = FHE.asEuint32(0);

// For each visit, add satisfaction (encrypted)
function recordPrivateVisit(..., uint8 _satisfaction) external {
    exhibitions[exhibitionId].privateSatisfactionSum = FHE.add(
        exhibitions[exhibitionId].privateSatisfactionSum,
        FHE.asEuint32(uint32(_satisfaction))
    );
}

// Decryption gives us total satisfaction
// Average = sum / count (both available)
```

## Statistical Operations on Encrypted Data

### Addition (Supported ✓)

Combining encrypted values:

```solidity
// Add encrypted values
euint32 total = FHE.add(value1, value2, value3);

// Use in aggregation
totalRevenue = FHE.add(totalRevenue, dailyRevenue);
```

**Cost:** Moderate gas usage

### Multiplication (Supported ✓)

```solidity
// Multiply encrypted values
euint32 product = FHE.mul(count, price);

// Example: Weight by importance
weighted = FHE.mul(satisfaction, importance);
```

**Cost:** Higher gas usage than addition

### Comparison (Supported ✓)

```solidity
// Compare encrypted values
ebool isGreater = FHE.gt(value1, value2);

// Count above threshold
if (isGreater) {
    aboveThreshold = FHE.add(aboveThreshold, 1);
}
```

**Cost:** Significant gas usage

### Division (Not Directly Supported)

To compute averages, use plaintext division:

```solidity
// ✗ Cannot divide encrypted values
// encryptedAverage = FHE.div(encryptedSum, encryptedCount);

// ✓ Decrypt sum, use plaintext count
// 1. Sum is encrypted, count is plaintext
euint32 encryptedSum;
uint32 plainCount = 0;

// 2. Request decryption of sum
FHE.requestDecryption(encryptedSum, this.revealAverage.selector);

// 3. Calculate average in callback
function revealAverage(uint256 requestId, uint32 sum) external {
    uint32 average = sum / plainCount;  // Plaintext division
}
```

## Aggregation Examples

### Example 1: Average Satisfaction

**Goal:** Find average satisfaction without exposing individual ratings

```solidity
// Aggregation phase (all encrypted)
privateSatisfactionSum = FHE.add(privateSatisfactionSum, rating);
publicVisitorCount++;  // Keep count public for division

// Decryption phase
FHE.requestDecryption(
    abi.encodePacked(privateSatisfactionSum),
    this.processAverageSatisfaction.selector
);

// Result processing
function processAverageSatisfaction(uint256 requestId, uint32 sum) external {
    // Now we can safely divide using public count
    uint32 average = sum / publicVisitorCount;
    emit AverageSatisfactionCalculated(average);
}
```

**Privacy:** Individual ratings remain encrypted. Only sum is decrypted, then averaged.

### Example 2: Interest Level Distribution

**Goal:** See distribution of interest levels without individual data

```solidity
// Track encrypted counts per interest level (1-5)
mapping(uint8 => euint32) public interestLevelCounts;

function recordFeedback(uint8 _interestLevel) external {
    interestLevelCounts[_interestLevel] = FHE.add(
        interestLevelCounts[_interestLevel],
        FHE.asEuint32(1)
    );
}

// Request decryption of all levels
function requestInterestDistribution() external onlyManager {
    for (uint8 level = 1; level <= 5; level++) {
        FHE.requestDecryption(
            abi.encodePacked(interestLevelCounts[level]),
            this.processInterestLevel.selector
        );
    }
}
```

**Privacy:** Individual preferences encrypted. Distribution counts decrypted.

### Example 3: Age Group Statistics

**Goal:** Understand visitor demographics by age group

```solidity
// Encrypted counts per age group
mapping(AgeGroup => euint32) public ageGroupVisitors;

function registerVisitor(uint8 _age) external {
    // Determine age group based on age
    AgeGroup group = getAgeGroup(_age);

    // Increment encrypted counter
    ageGroupVisitors[group] = FHE.add(
        ageGroupVisitors[group],
        FHE.asEuint32(1)
    );
}

// Request age statistics
function requestAgeStatistics() external onlyManager {
    bytes32[] memory cts = new bytes32[](4);
    // Prepare encrypted counts for all age groups
    // ...
    FHE.requestDecryption(cts, this.processAgeStats.selector);
}
```

**Privacy:** Individual ages encrypted. Age group distributions decrypted.

## Differential Privacy Techniques

### Technique 1: Noise Addition

Add random noise to encrypted statistics before decryption:

```solidity
function requestNoiseAggregation() external onlyManager {
    // Add noise to encrypted data
    euint32 noisySum = FHE.add(
        privateSatisfactionSum,
        FHE.asEuint32(getRandomNoise())
    );

    // Request decryption of noisy result
    FHE.requestDecryption(
        abi.encodePacked(noisySum),
        this.processNoisyReveal.selector
    );
}

function processNoisyReveal(uint256 requestId, uint32 noisySum) external {
    // Result is approximate but more private
}
```

### Technique 2: Minimum Threshold

Only decrypt aggregates above minimum size:

```solidity
function requestAggregateIfLarge() external onlyManager {
    require(publicVisitorCount >= MIN_AGGREGATE_SIZE, "Too few records");

    // Only request decryption if aggregate is large
    FHE.requestDecryption(
        abi.encodePacked(privateSatisfactionSum),
        this.processLargeAggregate.selector
    );
}
```

**Privacy:** Prevents inference attacks on small groups.

## Aggregation Patterns

### Pattern 1: Running Totals

Maintain encrypted running totals:

```solidity
euint32 totalRevenue;
euint32 totalTransactions;
euint32 totalCosts;

function recordTransaction(uint32 revenue, uint32 cost) external {
    totalRevenue = FHE.add(totalRevenue, FHE.asEuint32(revenue));
    totalCosts = FHE.add(totalCosts, FHE.asEuint32(cost));
    totalTransactions = FHE.add(totalTransactions, FHE.asEuint32(1));
}

// Profit = Revenue - Costs (on encrypted data)
euint32 profit = FHE.sub(totalRevenue, totalCosts);
```

### Pattern 2: Hierarchical Aggregation

Aggregate at multiple levels:

```solidity
// Level 1: Daily totals (encrypted)
mapping(uint32 => euint32) public dailyVisitors;

// Level 2: Weekly totals (encrypted)
mapping(uint32 => euint32) public weeklyVisitors;

// Level 3: Monthly totals (encrypted)
mapping(uint32 => euint32) public monthlyVisitors;

// Compute hierarchy while encrypted
function aggregateDailyToWeekly(uint32 day) external {
    uint32 week = day / 7;
    weeklyVisitors[week] = FHE.add(
        weeklyVisitors[week],
        dailyVisitors[day]
    );
}
```

### Pattern 3: Categorical Aggregation

Aggregate by categories:

```solidity
// By exhibition type
mapping(ExhibitionType => euint32) public typeVisitors;

// By satisfaction level
mapping(uint8 => euint32) public satisfactionBuckets;  // 1-10

// Update aggregates
function recordVisit(ExhibitionType _type, uint8 _satisfaction) external {
    typeVisitors[_type] = FHE.add(typeVisitors[_type], FHE.asEuint32(1));
    satisfactionBuckets[_satisfaction] = FHE.add(
        satisfactionBuckets[_satisfaction],
        FHE.asEuint32(1)
    );
}
```

## Performance Considerations

### Gas Cost Comparison

| Operation | Cost | Notes |
|-----------|------|-------|
| Encrypt (FHE.asEuint) | ~2000-3000 | Low cost |
| Addition (FHE.add) | ~5000-10000 | Moderate cost |
| Comparison (FHE.gt) | ~15000-20000 | Higher cost |
| Decryption Request | ~10000-15000 | Request only |

### Optimization Tips

1. **Batch Operations**
   ```solidity
   // ✓ Better: Add multiple values
   total = FHE.add(FHE.add(value1, value2), value3);

   // ✗ Worse: Separate additions
   total = FHE.add(total, value1);
   total = FHE.add(total, value2);
   total = FHE.add(total, value3);
   ```

2. **Minimize Comparisons**
   ```solidity
   // ✓ Better: One comparison
   result = FHE.select(FHE.gt(value, threshold), true, false);

   // ✗ Worse: Multiple comparisons
   if (FHE.gt(value, threshold1) && FHE.gt(value, threshold2)) { ... }
   ```

3. **Use Plain Counts**
   ```solidity
   // ✓ Better: Track count plaintext
   uint32 count = 0;
   euint32 sum;

   // ✗ Worse: Encrypt count too
   euint32 count = FHE.asEuint32(0);
   euint32 sum;
   ```

## Summary

Statistics aggregation with FHEVM:

1. **Encrypted Computation** - Add/multiply on encrypted data
2. **Selective Decryption** - Decrypt only final aggregates
3. **No Individual Exposure** - Individual records stay encrypted
4. **Meaningful Insights** - Derive useful statistics
5. **Privacy Guarantee** - Mathematical proof of privacy

The Private Museum Visit Tracker aggregates:
- Visitor counts per exhibition
- Satisfaction sums for averaging
- Demographic distributions by age group
- Exhibition type statistics

All while maintaining complete privacy of individual visitors.

---

Next: Learn about [Privacy Patterns](privacy-patterns.md) to understand advanced privacy design techniques.
