# Contributing to Private Museum Visit Tracker

Thank you for your interest in contributing to this FHEVM example project! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Guidelines](#contribution-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

This project follows a professional and respectful code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 7.0.0
- Git
- Basic understanding of Solidity
- Familiarity with FHEVM concepts (helpful but not required)

### Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/PrivateMuseumVisitTracker.git
   cd PrivateMuseumVisitTracker
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm test
   ```

6. **Verify everything works**
   ```bash
   npm run lint
   ```

## Development Workflow

### Creating a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bug fix branch
git checkout -b fix/issue-description
```

### Making Changes

1. **Write code** following the [Style Guide](#style-guide)
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Run tests** to ensure nothing breaks
5. **Commit changes** with clear messages

### Committing

Use clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "Add encrypted visitor preferences storage"
git commit -m "Fix access control bug in recordPrivateVisit"
git commit -m "Update API documentation for new functions"

# Bad commit messages
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
```

## Contribution Guidelines

### What to Contribute

#### Features
- New FHEVM patterns and examples
- Additional encrypted operations
- Enhanced privacy features
- Improved access control mechanisms

#### Bug Fixes
- Security vulnerabilities
- Logic errors
- Gas optimization issues
- Test failures

#### Documentation
- Improved explanations
- Code examples
- Tutorials and guides
- API reference updates

#### Tests
- New test cases
- Edge case coverage
- Performance tests
- Integration tests

### What NOT to Contribute

- Breaking changes without discussion
- Features unrelated to FHEVM education
- Changes that compromise privacy
- Unsafe encryption patterns
- Code without tests

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/PrivateMuseumVisitTracker.ts

# Run with coverage
npm run coverage
```

### Writing Tests

All new features must include tests:

```typescript
/**
 * @title Feature Name Tests
 * @notice Tests for new feature
 * @dev Demonstrates proper testing patterns
 *
 * @chapter: appropriate-chapter
 */
describe("New Feature", function () {
  it("should perform expected behavior", async function () {
    // Arrange
    const input = "test";

    // Act
    const result = await contract.newFunction(input);

    // Assert
    expect(result).to.equal("expected");
  });

  it("should reject invalid input", async function () {
    await expect(contract.newFunction("invalid"))
      .to.be.revertedWith("Expected error message");
  });
});
```

### Test Coverage

Maintain high test coverage:
- **Statements:** > 95%
- **Branches:** > 90%
- **Functions:** > 95%
- **Lines:** > 95%

## Documentation

### Code Documentation

Use NatSpec for all functions:

```solidity
/// @notice Clear description of what the function does
/// @dev Technical details about implementation
/// @param _paramName Description of parameter
/// @return Description of return value
function exampleFunction(uint256 _paramName) external returns (uint256) {
    // Implementation
}
```

### Updating Documentation

If you add new features:

1. **Update README.md** if it affects project overview
2. **Update DEVELOPER_GUIDE.md** if it affects development
3. **Add docs/*.md** files for new concepts
4. **Run documentation generator**
   ```bash
   npm run generate-docs
   ```

### Documentation Style

- Use clear, concise language
- Include code examples
- Explain WHY not just WHAT
- Link to related documentation
- Keep examples simple and focused

## Pull Request Process

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code follows style guide (`npm run lint`)
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### Submitting PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template** with:
   - Description of changes
   - Motivation and context
   - Type of change (feature/bugfix/docs)
   - Testing performed
   - Related issues

4. **Request review** from maintainers

### PR Template

```markdown
## Description
[Clear description of what this PR does]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] All existing tests pass
- [ ] New tests added for changes
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Commit messages are clear
```

### Review Process

1. **Automated checks** must pass (tests, linting)
2. **Code review** by at least one maintainer
3. **Address feedback** with new commits or explanations
4. **Approval** from maintainer
5. **Merge** when approved

## Style Guide

### Solidity

Follow the official [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html):

```solidity
// Use 4 spaces for indentation
contract Example {
    // State variables
    uint256 public value;

    // Functions ordered by visibility
    function publicFunction() external {
        // Implementation
    }

    function privateFunction() private {
        // Implementation
    }
}
```

### TypeScript

Follow TypeScript best practices:

```typescript
// Use interfaces for type definitions
interface Config {
  name: string;
  value: number;
}

// Use descriptive variable names
const encryptedValue = await fhevm.encrypt(value);

// Use async/await for promises
async function deployContract(): Promise<Contract> {
  const factory = await ethers.getContractFactory("Contract");
  return factory.deploy();
}
```

### Naming Conventions

- **Contracts:** PascalCase (`PrivateMuseumVisitTracker`)
- **Functions:** camelCase (`registerVisitor`)
- **Variables:** camelCase (`encryptedAge`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_VISITORS`)
- **Private variables:** _leadingUnderscore (`_privateValue`)

### Comments

```solidity
// Single-line comments for brief explanations
uint256 public totalVisitors; // Counter for all visitors

/**
 * Multi-line comments for detailed explanations
 * Use NatSpec format for functions
 */
function complexFunction() external {
    // Explain complex logic with inline comments
}
```

## FHEVM Best Practices

### Encryption

```solidity
// ✓ Good - immediate encryption
function storeValue(uint32 _value) external {
    euint32 encrypted = FHE.asEuint32(_value);
    FHE.allowThis(encrypted);
    FHE.allow(encrypted, msg.sender);
}

// ✗ Bad - storing plaintext first
function storeValue(uint32 _value) external {
    uint32 temp = _value;  // Unnecessary plaintext storage
    euint32 encrypted = FHE.asEuint32(temp);
}
```

### Access Control

```solidity
// ✓ Good - explicit permissions
euint32 encrypted = FHE.asEuint32(value);
FHE.allowThis(encrypted);
FHE.allow(encrypted, owner);

// ✗ Bad - missing permissions
euint32 encrypted = FHE.asEuint32(value);
// No permissions set!
```

## Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Open a GitHub Issue
- **Security:** Email security concerns privately
- **Chat:** Join [Zama Discord](https://discord.com/invite/zama)

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the BSD-3-Clause-Clear License.

---

Thank you for contributing to FHEVM education! Your efforts help make privacy-preserving blockchain technology more accessible.
