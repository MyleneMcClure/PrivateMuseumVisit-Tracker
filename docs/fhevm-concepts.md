# FHEVM Concepts

A comprehensive guide to Fully Homomorphic Encryption for Ethereum Virtual Machine (FHEVM).

## What is FHE?

Fully Homomorphic Encryption (FHE) allows computation on encrypted data without decryption. This means:

- Data stays encrypted throughout computation
- Results are encrypted
- Only authorized parties can decrypt results
- Privacy is mathematically guaranteed

## Why FHEVM?

Traditional blockchain applications require plaintext data:
- **Privacy risk:** All data visible on-chain
- **Regulatory challenge:** GDPR and privacy laws
- **Trust issue:** Users hesitant to share sensitive data

FHEVM solves this:
- **Encrypted data:** Sensitive information stays encrypted
- **On-chain computation:** Smart contracts process encrypted data
- **Privacy guarantee:** Mathematical proof of privacy

## Encrypted Types

### euint8 (8-bit Encrypted Unsigned Integer)

- **Size:** 8 bits (0-255)
- **Use case:** Small values like ratings, flags, indices
- **Example:** Age groups, satisfaction ratings

```solidity
euint8 encrypted = FHE.asEuint8(value);
```

### euint16 (16-bit Encrypted Unsigned Integer)

- **Size:** 16 bits (0-65,535)
- **Use case:** Medium values
- **Example:** Amounts, counts

```solidity
euint16 encrypted = FHE.asEuint16(value);
```

### euint32 (32-bit Encrypted Unsigned Integer)

- **Size:** 32 bits (0-4,294,967,295)
- **Use case:** Larger values, timestamps, counters
- **Example:** Visitor counts, timestamps

```solidity
euint32 encrypted = FHE.asEuint32(value);
```

### euint64 (64-bit Encrypted Unsigned Integer)

- **Size:** 64 bits
- **Use case:** Very large values
- **Example:** Large financial amounts

```solidity
euint64 encrypted = FHE.asEuint64(value);
```

### ebool (Encrypted Boolean)

- **Use case:** Encrypted true/false values
- **Example:** Permission flags, conditions

```solidity
ebool encrypted = FHE.asEbool(true);
```

## FHE Operations

### Encryption

Convert plaintext to encrypted value:

```solidity
// Encrypt 8-bit value
euint8 enc = FHE.asEuint8(value);

// Encrypt 32-bit value
euint32 enc = FHE.asEuint32(value);
```

### Arithmetic Operations

Perform calculations on encrypted data:

#### Addition
```solidity
euint32 sum = FHE.add(enc1, enc2);
```

#### Subtraction
```solidity
euint32 diff = FHE.sub(enc1, enc2);
```

#### Multiplication
```solidity
euint32 prod = FHE.mul(enc1, enc2);
```

### Comparison Operations

Compare encrypted values without decryption:

#### Equality
```solidity
ebool isEqual = FHE.eq(enc1, enc2);
```

#### Greater Than
```solidity
ebool isGreater = FHE.gt(enc1, enc2);
```

#### Less Than
```solidity
ebool isLess = FHE.lt(enc1, enc2);
```

#### Greater Than or Equal
```solidity
ebool isGreaterEq = FHE.ge(enc1, enc2);
```

#### Less Than or Equal
```solidity
ebool isLessEq = FHE.le(enc1, enc2);
```

### Conditional Operations

#### If-Then-Else
```solidity
euint32 result = FHE.select(
    FHE.eq(enc1, enc2),  // condition
    valueIfTrue,          // true value
    valueIfFalse          // false value
);
```

## Access Control

### FHE.allowThis()

Allow contract to access its own encrypted data:

```solidity
euint32 encrypted = FHE.asEuint32(value);
FHE.allowThis(encrypted);  // Contract can decrypt when needed
```

### FHE.allow()

Grant a specific address decryption access:

```solidity
euint32 encrypted = FHE.asEuint32(value);
FHE.allow(encrypted, userAddress);  // User can decrypt their own data
```

### FHE.allowTransient()

Grant temporary access for an operation:

```solidity
euint32 encrypted = FHE.asEuint32(value);
FHE.allowTransient(encrypted, address(this));  // Temporary access
```

## Decryption Flows

### User Decryption

Users can decrypt data authorized for them:

1. **On-chain:** User calls view function
2. **Off-chain:** Decrypt using fhevm library
3. **JavaScript example:**
   ```javascript
   const decrypted = await fhevm.userDecryptEuint32(
       encryptedData,
       contractAddress,
       userSigner
   );
   ```

### Public Decryption

Authorized parties can request decryption:

```solidity
function requestStatistics() external {
    FHE.requestDecryption(
        encryptedValues,
        this.onDecryptionResult.selector
    );
}

function onDecryptionResult(uint256 requestId, uint32 result) external {
    // Handle decrypted result
}
```

## Working with External Encrypted Values

### Creating Encrypted Input

From client-side (TypeScript):

```typescript
const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, userAddress)
    .add32(plainValue)
    .encrypt();

// Send to contract
await contract.function(
    encryptedInput.handles[0],
    encryptedInput.inputProof
);
```

### Verifying Input Proofs

Contracts can verify encrypted inputs:

```solidity
function processInput(
    externalEuint32 inputEuint32,
    bytes calldata inputProof
) external {
    euint32 verified = FHE.fromExternal(inputEuint32, inputProof);
    // Now can use verified encrypted value
}
```

## Privacy Guarantees

### What FHEVM Protects

✓ **Encrypted at rest:** Data is encrypted on-chain
✓ **Encrypted in transit:** No plaintext transmission
✓ **Encrypted in computation:** Operations on encrypted data
✓ **Access controlled:** Only authorized parties can decrypt

### What FHEVM Doesn't Protect

✗ **Metadata:** Transaction patterns are visible
✗ **Function calls:** Which function is called is visible
✗ **Values before encryption:** Data before encryption is visible
✗ **Decrypted results:** Once decrypted, data is plaintext

## Performance Considerations

### Gas Costs

FHE operations are expensive:
- Encryption: Moderate cost
- Arithmetic: Higher cost
- Comparison: Higher cost
- Access control: Minimal cost

**Optimization tips:**
1. Batch encrypted operations when possible
2. Use smallest suitable encrypted type
3. Minimize comparisons on encrypted data
4. Use FHE for sensitive data only

### Computation

FHE computations are slower:
- Encryption/decryption takes time
- Operations on encrypted data are slower
- Off-chain decryption happens asynchronously

**Design considerations:**
1. Plan for decryption latency
2. Use asynchronous patterns
3. Cache results when appropriate
4. Optimize contract logic

## Best Practices

1. **Encrypt Early**
   - Encrypt data as soon as received
   - Never store plaintext sensitive data
   - Always verify proof of encrypted input

2. **Minimize Encrypted Operations**
   - Only encrypt sensitive data
   - Use plaintext for non-sensitive values
   - Reduce computation on encrypted data

3. **Plan Access Control**
   - Set appropriate permissions
   - Use FHE.allow for user data
   - Use FHE.allowThis for contract data
   - Clear permissions when no longer needed

4. **Test Thoroughly**
   - Test all encrypted operations
   - Verify permissions work correctly
   - Check edge cases with encrypted values
   - Test decryption flows

5. **Document Clearly**
   - Document which data is encrypted
   - Explain why data is encrypted
   - Show usage patterns
   - Provide examples

## Common Patterns

### Pattern 1: User-Owned Encrypted Data

```solidity
struct UserData {
    euint32 encryptedValue;
}

mapping(address => UserData) public userData;

function setData(uint32 value) external {
    euint32 encrypted = FHE.asEuint32(value);
    userData[msg.sender].encryptedValue = encrypted;

    FHE.allow(encrypted, msg.sender);  // User can decrypt
    FHE.allowThis(encrypted);           // Contract can use it
}
```

### Pattern 2: Aggregate Statistics

```solidity
euint32 private totalEncrypted;

function addToTotal(uint32 value) external {
    totalEncrypted = FHE.add(
        totalEncrypted,
        FHE.asEuint32(value)
    );
}

function requestTotal() external {
    FHE.requestDecryption(
        abi.encodePacked(totalEncrypted),
        this.onTotalDecrypted.selector
    );
}
```

### Pattern 3: Conditional Logic

```solidity
function processIfEqual(
    euint32 enc1,
    euint32 enc2,
    uint32 valueIfTrue
) external {
    ebool isEqual = FHE.eq(enc1, enc2);
    euint32 result = FHE.select(isEqual, valueIfTrue, 0);
    // Use result
}
```

## Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Solidity Library](https://docs.zama.ai/fhevm/solidity-library)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/fhevm/getting-started/hardhat)
- [Zama Discord](https://discord.com/invite/zama)

---

Understanding FHEVM is key to building privacy-preserving blockchain applications. The Private Museum Visit Tracker demonstrates these concepts in a practical, real-world context.
