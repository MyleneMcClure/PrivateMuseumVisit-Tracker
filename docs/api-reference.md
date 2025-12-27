# API Reference

Complete documentation of all smart contract functions in the Private Museum Visit Tracker.

## State Variables

### Public Variables

#### `owner`
```solidity
address public owner
```
The contract owner with administrative privileges.

#### `museumManager`
```solidity
address public museumManager
```
The museum manager who can create exhibitions and manage system state.

#### `totalExhibitions`
```solidity
uint32 public totalExhibitions
```
Total number of exhibitions created in the system.

#### `totalRegisteredVisitors`
```solidity
uint32 public totalRegisteredVisitors
```
Total number of registered visitors.

### Enumerations

#### `ExhibitionType`
```solidity
enum ExhibitionType { History, Art, Science, Culture, Technology, Nature }
```
- 0: History
- 1: Art
- 2: Science
- 3: Culture
- 4: Technology
- 5: Nature

#### `AgeGroup`
```solidity
enum AgeGroup { Child, Teen, Adult, Senior }
```
- 0: Child (< 13 years)
- 1: Teen (13-19 years)
- 2: Adult (20-59 years)
- 3: Senior (≥ 60 years)

## Owner Functions

### setMuseumManager

```solidity
function setMuseumManager(address _manager) external onlyOwner
```

Set a new museum manager address.

**Parameters:**
- `_manager` (address): New museum manager address

**Requirements:**
- Only callable by contract owner

**Emits:** No events

---

## Manager Functions

### createExhibition

```solidity
function createExhibition(
    string memory _name,
    ExhibitionType _type,
    uint32 _startDate,
    uint32 _endDate
) external onlyMuseumManager
```

Create a new exhibition.

**Parameters:**
- `_name` (string): Exhibition name
- `_type` (ExhibitionType): Type of exhibition (0-5)
- `_startDate` (uint32): Unix timestamp of start date
- `_endDate` (uint32): Unix timestamp of end date

**Requirements:**
- Only callable by museum manager or owner
- `_endDate` must be greater than `_startDate`

**Emits:** `ExhibitionCreated(uint32 exhibitionId, string name, ExhibitionType exhibitionType)`

**Example:**
```solidity
uint32 startDate = 1704067200;  // Jan 1, 2024
uint32 endDate = 1706745600;    // Feb 1, 2024
contract.createExhibition("Ancient Civilizations", 0, startDate, endDate);
```

---

### setExhibitionStatus

```solidity
function setExhibitionStatus(uint32 _exhibitionId, bool _isActive) external onlyMuseumManager
```

Change the active status of an exhibition.

**Parameters:**
- `_exhibitionId` (uint32): ID of the exhibition
- `_isActive` (bool): New active status

**Requirements:**
- Only callable by museum manager or owner
- Exhibition must exist (ID between 1 and totalExhibitions)

**Emits:** No events

---

### requestExhibitionStats

```solidity
function requestExhibitionStats(uint32 _exhibitionId) external onlyMuseumManager
```

Request decryption of exhibition statistics (visitor count and satisfaction sum).

**Parameters:**
- `_exhibitionId` (uint32): ID of the exhibition

**Requirements:**
- Only callable by museum manager or owner
- Exhibition must exist

**Emits:** `StatisticsRequested(uint32 exhibitionId, address requester)`

**Note:** This is an asynchronous operation. The result will be available after off-chain decryption.

---

## Visitor Functions

### registerVisitor

```solidity
function registerVisitor(uint8 _age) external
```

Register as a visitor with encrypted age.

**Parameters:**
- `_age` (uint8): Visitor's age (must be between 1 and 119)

**Requirements:**
- Caller must not be already registered
- Age must be between 1 and 119

**Emits:** `VisitorRegistered(address indexed visitor, uint32 timestamp)`

**Notes:**
- Age is encrypted immediately upon receipt
- Age is automatically categorized into an age group
- Registration is one-time per address

**Example:**
```solidity
contract.registerVisitor(25);
```

---

### recordPrivateVisit

```solidity
function recordPrivateVisit(
    uint32 _exhibitionId,
    uint8 _satisfaction,
    uint32 _duration,
    uint8 _interestLevel
) external onlyRegisteredVisitor
```

Record a private visit to an exhibition with encrypted feedback.

**Parameters:**
- `_exhibitionId` (uint32): ID of the exhibition (1 to totalExhibitions)
- `_satisfaction` (uint8): Satisfaction rating (must be 1-10)
- `_duration` (uint32): Visit duration in minutes
- `_interestLevel` (uint8): Interest level (must be 1-5)

**Requirements:**
- Caller must be registered visitor
- Exhibition must exist and be active
- Satisfaction must be between 1 and 10
- Interest level must be between 1 and 5
- Visitor cannot record duplicate visits to same exhibition

**Emits:**
- `PrivateVisitRecorded(address indexed visitor, uint32 indexed exhibitionId)`
- `SatisfactionRecorded(uint32 indexed exhibitionId, address indexed visitor)`

**Notes:**
- All data is encrypted and stored on-chain
- One visit per exhibition per visitor
- Visit updates exhibition statistics

**Example:**
```solidity
contract.recordPrivateVisit(
    1,      // Exhibition ID
    8,      // Satisfaction rating (8/10)
    120,    // Visit duration (120 minutes)
    4       // Interest level (4/5)
);
```

---

## View Functions

### getPublicStats

```solidity
function getPublicStats() external view
    returns (uint32 totalExhibitionsCount, uint32 totalRegisteredVisitorsCount)
```

Get overall public statistics.

**Returns:**
- `totalExhibitionsCount` (uint32): Total number of exhibitions
- `totalRegisteredVisitorsCount` (uint32): Total number of registered visitors

**Example:**
```typescript
const [exhibitions, visitors] = await contract.getPublicStats();
console.log(`${exhibitions} exhibitions, ${visitors} visitors`);
```

---

### getExhibitionInfo

```solidity
function getExhibitionInfo(uint32 _exhibitionId) external view
    returns (
        string memory name,
        ExhibitionType exhibitionType,
        uint32 startDate,
        uint32 endDate,
        bool isActive,
        uint32 publicVisitorCount
    )
```

Get public information about an exhibition.

**Parameters:**
- `_exhibitionId` (uint32): ID of the exhibition

**Returns:**
- `name` (string): Exhibition name
- `exhibitionType` (ExhibitionType): Type of exhibition
- `startDate` (uint32): Start timestamp
- `endDate` (uint32): End timestamp
- `isActive` (bool): Whether exhibition is currently active
- `publicVisitorCount` (uint32): Number of registered visitors

**Requirements:**
- Exhibition must exist

**Example:**
```typescript
const [name, type, start, end, active, count] =
    await contract.getExhibitionInfo(1);
```

---

### getMyStats

```solidity
function getMyStats() external view
    returns (bool isRegistered, uint32 registrationDate)
```

Get the calling visitor's own statistics.

**Returns:**
- `isRegistered` (bool): Whether the visitor is registered
- `registrationDate` (uint32): Unix timestamp of registration

**Example:**
```typescript
const [registered, date] = await contract.getMyStats();
console.log(`Registered: ${registered} on ${date}`);
```

---

### getMyVisitRecord

```solidity
function getMyVisitRecord(uint32 _exhibitionId) external view
    returns (bool hasVisited)
```

Check if the calling visitor has visited a specific exhibition.

**Parameters:**
- `_exhibitionId` (uint32): ID of the exhibition

**Returns:**
- `hasVisited` (bool): Whether the visitor has recorded a visit

**Example:**
```typescript
const visited = await contract.getMyVisitRecord(1);
console.log(`Visited: ${visited}`);
```

---

### getExhibitionVisitorCount

```solidity
function getExhibitionVisitorCount(uint32 _exhibitionId) external view
    returns (uint32)
```

Get the number of visitors to an exhibition.

**Parameters:**
- `_exhibitionId` (uint32): ID of the exhibition

**Returns:**
- (uint32): Number of registered visitors to this exhibition

**Example:**
```typescript
const count = await contract.getExhibitionVisitorCount(1);
console.log(`${count} visitors to exhibition 1`);
```

---

## Events

### ExhibitionCreated

```solidity
event ExhibitionCreated(
    uint32 indexed exhibitionId,
    string name,
    ExhibitionType exhibitionType
)
```

Emitted when a new exhibition is created.

---

### VisitorRegistered

```solidity
event VisitorRegistered(
    address indexed visitor,
    uint32 timestamp
)
```

Emitted when a visitor registers.

---

### PrivateVisitRecorded

```solidity
event PrivateVisitRecorded(
    address indexed visitor,
    uint32 indexed exhibitionId
)
```

Emitted when a visitor records a private visit.

---

### SatisfactionRecorded

```solidity
event SatisfactionRecorded(
    uint32 indexed exhibitionId,
    address indexed visitor
)
```

Emitted when a visitor submits satisfaction feedback.

---

### StatisticsRequested

```solidity
event StatisticsRequested(
    uint32 exhibitionId,
    address requester
)
```

Emitted when a manager requests exhibition statistics.

---

## Error Messages

- `"Not authorized"` - Function caller is not the owner
- `"Not museum manager"` - Function caller is not the museum manager
- `"Invalid exhibition"` - Exhibition ID is invalid (0 or > totalExhibitions)
- `"Invalid date range"` - End date is not after start date
- `"Already registered"` - Visitor is already registered
- `"Invalid age"` - Age is 0 or >= 120
- `"Visitor not registered"` - Visitor has not registered
- `"Exhibition not active"` - Exhibition is not currently active
- `"Satisfaction must be 1-10"` - Satisfaction is out of range
- `"Interest level must be 1-5"` - Interest level is out of range
- `"Visit already recorded"` - Visitor has already recorded a visit to this exhibition

---

## Usage Patterns

### Complete Visitor Flow

```typescript
// 1. Register
await contract.registerVisitor(25);

// 2. Check registration
const [isRegistered] = await contract.getMyStats();

// 3. Visit an exhibition
await contract.recordPrivateVisit(1, 8, 120, 4);

// 4. Check visit record
const visited = await contract.getMyVisitRecord(1);

// 5. View statistics
const [exhibitions, visitors] = await contract.getPublicStats();
```

### Complete Manager Flow

```typescript
// 1. Create exhibition
await contract.createExhibition("Art", 1, startDate, endDate);

// 2. View exhibition info
const info = await contract.getExhibitionInfo(1);

// 3. Get visitor count
const count = await contract.getExhibitionVisitorCount(1);

// 4. Request statistics
await contract.requestExhibitionStats(1);

// 5. Update status
await contract.setExhibitionStatus(1, false);
```

---

Generated from PrivateMuseumVisitTracker v1.0.0
