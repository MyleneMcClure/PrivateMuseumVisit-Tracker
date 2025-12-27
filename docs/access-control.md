# Access Control Patterns

## Overview

Access control is critical for managing who can perform what operations in a FHEVM contract. This chapter covers the patterns used in the Private Museum Visit Tracker.

## Modifier-Based Access Control

### onlyOwner

Restricts function execution to the contract owner.

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not authorized");
    _;
}

function setMuseumManager(address _manager) external onlyOwner {
    museumManager = _manager;
}
```

**Usage:** Administrative functions that should only be callable by the contract deployer.

### onlyMuseumManager

Restricts functions to the museum manager or owner.

```solidity
modifier onlyMuseumManager() {
    require(msg.sender == museumManager || msg.sender == owner, "Not museum manager");
    _;
}

function createExhibition(
    string memory _name,
    ExhibitionType _type,
    uint32 _startDate,
    uint32 _endDate
) external onlyMuseumManager {
    // Implementation
}
```

**Usage:** Functions that manage exhibitions and statistics.

### onlyRegisteredVisitor

Restricts functions to registered visitors.

```solidity
modifier onlyRegisteredVisitor() {
    require(visitorProfiles[msg.sender].isRegistered, "Visitor not registered");
    _;
}

function recordPrivateVisit(
    uint32 _exhibitionId,
    uint8 _satisfaction,
    uint32 _duration,
    uint8 _interestLevel
) external onlyRegisteredVisitor {
    // Implementation
}
```

**Usage:** Functions that only registered users should access.

## Data Access Control with FHE

### FHE.allowThis()

Allows the contract to access its own encrypted data.

```solidity
// In registerVisitor()
euint8 encryptedAge = FHE.asEuint8(_age);
FHE.allowThis(encryptedAge);  // Contract can decrypt if needed
```

**When to use:** Any encrypted data that the contract needs to read or process.

### FHE.allow()

Grants a specific address access to decrypt data.

```solidity
// Allow user to decrypt their own data
FHE.allow(encryptedAge, msg.sender);
```

**When to use:** Individual user data that they should be able to decrypt themselves.

## Access Control Patterns

### Pattern 1: Manager-Only Administration

Only museum managers can:
- Create exhibitions
- Request statistics
- Modify exhibition status

```typescript
// ✓ Manager can create exhibition
await contract.connect(managerSigner).createExhibition(
    "Test Exhibition",
    0,
    startDate,
    endDate
);

// ✗ Non-manager cannot
await expect(
    contract.connect(visitorSigner).createExhibition(...)
).to.be.revertedWith("Not museum manager");
```

### Pattern 2: User-Owned Data

Users can only access their own data:

```solidity
function getMyStats() external view returns (bool, uint32) {
    return (
        visitorProfiles[msg.sender].isRegistered,
        visitorProfiles[msg.sender].registrationDate
    );
}
```

**Benefits:**
- Users cannot read other users' data
- Data is still encrypted on-chain
- Privacy is enforced at the contract level

### Pattern 3: Graduated Permissions

Different permission levels for different operations:

```solidity
// Public - anyone can call
function getExhibitionInfo(uint32 _exhibitionId) external view {
    // Returns only public information
}

// Visitor-only - registered users can call
function recordPrivateVisit(...) external onlyRegisteredVisitor {
    // Records encrypted visit data
}

// Manager-only - only manager/owner can call
function requestExhibitionStats(uint32 _exhibitionId) external onlyMuseumManager {
    // Requests decryption of statistics
}

// Owner-only - only owner can call
function setMuseumManager(address _manager) external onlyOwner {
    // Critical administrative function
}
```

## Testing Access Control

### Test Manager Restrictions

```typescript
it("should enforce manager-only functions", async function () {
    await expect(
        contract.connect(signers.alice).createExhibition(
            "Unauthorized",
            0,
            startDate,
            endDate
        )
    ).to.be.revertedWith("Not museum manager");
});
```

### Test User Isolation

```typescript
it("should prevent users from reading others' data", async function () {
    // Register Alice
    await contract.connect(signers.alice).registerVisitor(25);

    // Bob gets his own stats
    const [bobRegistered] = await contract.connect(signers.bob).getMyStats();
    expect(bobRegistered).to.be.false;

    // Bob cannot see Alice's stats directly
    // (This is enforced by contract design)
});
```

### Test Permission Escalation

```typescript
it("should prevent privilege escalation", async function () {
    // Non-manager tries to set themselves as manager
    await expect(
        contract.connect(signers.alice).setMuseumManager(signers.alice.address)
    ).to.be.revertedWith("Not authorized");
});
```

## Best Practices

1. **Principle of Least Privilege**
   - Grant minimum necessary permissions
   - Use specific modifiers for each function
   - Avoid catch-all admin roles

2. **Clear Authorization**
   - Make permissions explicit in code
   - Use descriptive error messages
   - Document access requirements in NatSpec

3. **Data Isolation**
   - Users can only access their own data
   - Use msg.sender to enforce ownership
   - Verify permissions before operations

4. **Audit Trail**
   - Emit events for privileged operations
   - Log who made administrative changes
   - Enable accountability

5. **Separation of Concerns**
   - Separate user functions from admin functions
   - Use different modifiers for different roles
   - Keep responsibility focused

## Common Mistakes

### ✗ Missing Permission Checks

```solidity
// ✗ Bad - no access control
function deleteData(address _user) external {
    delete userData[_user];
}

// ✓ Good - check permissions
function deleteData(address _user) external onlyOwner {
    delete userData[_user];
}
```

### ✗ Unclear Access Rules

```solidity
// ✗ Bad - unclear who can call
function updateValue(uint256 _value) external {
    if (msg.sender == owner) {
        // ...
    } else if (msg.sender == manager) {
        // ...
    }
}

// ✓ Good - clear modifiers
function updateValueAsOwner(uint256 _value) external onlyOwner {
    // ...
}

function updateValueAsManager(uint256 _value) external onlyMuseumManager {
    // ...
}
```

### ✗ Overpermissive Access

```solidity
// ✗ Bad - allows anyone to see encrypted data
function getEncryptedData(address _user) external view returns (euint8) {
    return userData[_user];
}

// ✓ Good - only allow user to see their own
function getMyEncryptedData() external view returns (euint8) {
    return userData[msg.sender];
}
```

## Summary

The Private Museum Visit Tracker implements a three-tier access control system:

1. **Owner-Only Functions:** Contract administration
2. **Manager Functions:** Exhibition and statistics management
3. **Visitor Functions:** Visit recording and personal data access

Combined with FHE access control (FHE.allow), this ensures:
- Data privacy at the contract level
- Clear authorization rules
- User autonomy over personal data
- Administrative oversight

---

Next: Learn about [Decryption Flows](decryption.md) to understand how encrypted data is revealed when needed.
