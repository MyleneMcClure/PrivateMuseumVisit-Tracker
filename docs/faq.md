# Frequently Asked Questions (FAQ)

Common questions about the Private Museum Visit Tracker and FHEVM.

## General Questions

### What is this project?

The Private Museum Visit Tracker is an educational example demonstrating how to build privacy-preserving applications using FHEVM (Fully Homomorphic Encryption for Ethereum Virtual Machine). It shows how museums can collect visitor analytics while protecting individual privacy.

### Is this production-ready?

This is an **educational example** designed to demonstrate FHEVM patterns. While the code follows best practices, it should be thoroughly audited and tested before any production use.

### Can I use this code in my project?

Yes! This code is licensed under BSD-3-Clause-Clear, allowing you to use, modify, and distribute it. Please review the LICENSE file for details.

## FHEVM Questions

### What is FHEVM?

FHEVM is Fully Homomorphic Encryption for Ethereum Virtual Machine. It allows smart contracts to perform computations on encrypted data without ever decrypting it, enabling true privacy on blockchain.

### How does FHEVM differ from regular Solidity?

Regular Solidity:
- All data is public on-chain
- Computations happen on plaintext values
- Privacy requires off-chain solutions

FHEVM:
- Sensitive data stays encrypted
- Computations work on encrypted values
- Privacy is built into the blockchain

### What types of encryption does FHEVM support?

FHEVM supports encrypted unsigned integers:
- `euint8` - 8-bit (0-255)
- `euint16` - 16-bit (0-65,535)
- `euint32` - 32-bit (0-4,294,967,295)
- `euint64` - 64-bit
- `ebool` - Encrypted boolean

### Can I perform all operations on encrypted data?

You can perform many operations:
- ✓ Arithmetic: add, subtract, multiply
- ✓ Comparison: equal, greater than, less than
- ✓ Conditional: if-then-else (FHE.select)
- ✓ Bitwise: AND, OR, XOR (limited)

Some operations are not supported or expensive:
- ✗ Division (expensive)
- ✗ Complex math (sqrt, etc.)
- ✗ String operations

## Project-Specific Questions

### Why museum visitor tracking?

Museum visitor tracking is a relatable real-world use case that demonstrates:
- Personal data encryption (age, feedback)
- Aggregate analytics (total visitors, satisfaction)
- Access control (visitor vs. manager permissions)
- Privacy preservation (individual anonymity)

### What data is encrypted?

Encrypted data includes:
- Visitor age
- Age group categorization
- Satisfaction ratings
- Interest levels
- Visit duration
- Aggregate statistics

Public data includes:
- Exhibition names and types
- Exhibition dates
- Total visitor counts (aggregate only)
- Registration status

### Can visitors see other visitors' data?

No. The contract enforces strict access control:
- Visitors can only see their own registration status
- Encrypted personal data cannot be decrypted by others
- Managers can only see aggregate statistics

### How is privacy maintained?

Privacy is maintained through:
1. **Immediate encryption** - Data encrypted before storage
2. **Access control** - FHE.allow limits decryption access
3. **Aggregate only** - Statistics are combined, not individual
4. **No plaintext** - Sensitive data never stored unencrypted

## Technical Questions

### Why do tests skip on Sepolia?

The test suite uses FHEVM mock functions for fast testing. On Sepolia, the real FHEVM system is used, which:
- Requires actual gas costs
- Has asynchronous decryption
- Needs external infrastructure

Tests are designed for the mock environment. For Sepolia, deploy and interact via scripts instead.

### How do I deploy to Sepolia?

1. **Set up environment variables:**
   ```bash
   MNEMONIC="your mnemonic"
   INFURA_API_KEY="your infura key"
   ETHERSCAN_API_KEY="your etherscan key"
   ```

2. **Get Sepolia ETH** from a faucet

3. **Deploy:**
   ```bash
   npm run deploy:sepolia
   ```

4. **Verify (optional):**
   ```bash
   npm run verify:sepolia
   ```

### Why are gas costs higher with FHEVM?

FHE operations are computationally expensive:
- Encryption: Moderate cost
- Arithmetic on encrypted data: Higher cost
- Comparison operations: Higher cost
- Access control: Minimal cost

This is the trade-off for privacy. Optimize by:
- Using smallest suitable encrypted type (euint8 vs euint32)
- Batching operations
- Encrypting only sensitive data

### Can I decrypt data on-chain?

**User decryption:** Users can decrypt their authorized data off-chain using the FHEVM library.

**Public decryption:** Authorized parties can request decryption via `FHE.requestDecryption()`, which triggers off-chain decryption and returns results to a callback function.

**On-chain direct decryption:** Not available. Decryption always happens off-chain for security.

### How do encrypted comparisons work?

Encrypted comparisons return encrypted boolean results:

```solidity
ebool isEqual = FHE.eq(encrypted1, encrypted2);
ebool isGreater = FHE.gt(encrypted1, encrypted2);

// Use result in conditional logic
euint32 result = FHE.select(
    isEqual,
    valueIfTrue,
    valueIfFalse
);
```

The actual comparison result stays encrypted until authorized decryption.

## Development Questions

### How do I add a new feature?

1. Update the contract in `contracts/`
2. Add tests in `test/`
3. Run `npm test` to verify
4. Update documentation
5. Submit a pull request

See [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) for details.

### How do I add new encrypted fields?

```solidity
// 1. Add to struct
struct MyData {
    euint32 newEncryptedField;
}

// 2. Encrypt when storing
euint32 encrypted = FHE.asEuint32(value);
FHE.allowThis(encrypted);
FHE.allow(encrypted, user);

// 3. Store
myData[user] = MyData({
    newEncryptedField: encrypted
});

// 4. Add tests
it("should store new field", async function () {
    await contract.storeNewField(value);
    // Assertions
});
```

### How do I generate documentation?

```bash
npm run generate-docs
```

This reads JSDoc/TSDoc comments from test files and generates markdown documentation in `docs/`.

### Why is TypeScript configuration strict?

Strict TypeScript catches bugs early:
- Type safety prevents errors
- Better IDE support
- Easier refactoring
- Clearer code

You can relax settings in `tsconfig.json` if needed, but strict mode is recommended.

## Troubleshooting

### Tests fail with "fhevm is not defined"

Ensure you're importing fhevm correctly:

```typescript
import { ethers, fhevm } from "hardhat";
```

And that `@fhevm/hardhat-plugin` is installed and loaded in `hardhat.config.ts`.

### "Type X is not assignable to type Y"

Regenerate TypeChain types:

```bash
npm run clean
npm run compile
```

### Compilation fails

Check:
- Solidity version is 0.8.24
- `@fhevm/solidity` is installed
- Hardhat configuration is correct

```bash
npm install
npm run compile
```

### Deployment fails on Sepolia

Verify:
- You have Sepolia ETH
- INFURA_API_KEY is set correctly
- Network configuration is correct in `hardhat.config.ts`
- Mnemonic is valid

### "Cannot read properties of undefined"

Usually means:
- Contract not deployed
- Incorrect network
- Missing environment variables

Check deployment logs and network configuration.

## Learning Resources

### Where can I learn more about FHEVM?

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama GitHub](https://github.com/zama-ai/fhevm)
- [Zama Discord Community](https://discord.com/invite/zama)
- This project's [docs/](../docs/) folder

### Are there other FHEVM examples?

Yes! Check:
- [Zama FHEVM Examples](https://github.com/zama-ai/fhevm/tree/main/examples)
- [Zama dApps Repository](https://github.com/zama-ai/dapps)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)

### How can I get help?

- **Documentation:** Read [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)
- **Issues:** Open a GitHub issue
- **Community:** Join [Zama Discord](https://discord.com/invite/zama)
- **Forum:** Post on [Zama Community Forum](https://community.zama.ai)

## Contributing

### How can I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Contribution guidelines
- Development workflow
- Code style guide
- Pull request process

### What kind of contributions are welcome?

- Bug fixes
- New features
- Documentation improvements
- Test coverage
- Performance optimizations
- Educational examples

### Do I need to know FHEVM to contribute?

Not necessarily! Contributions welcome for:
- Documentation improvements
- Test coverage
- Bug reports
- Feature suggestions

For code contributions, basic FHEVM understanding is helpful.

## License & Legal

### What license is this project under?

BSD-3-Clause-Clear. See [LICENSE](../LICENSE) file.

### Can I use this commercially?

Yes, the BSD-3-Clause-Clear license allows commercial use. Read the full license for details and limitations.

### Do I need to attribute the original project?

The license requires retaining copyright notices in redistributed code. Check LICENSE for full requirements.

---

**Don't see your question?**

- Check [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) for development questions
- Check [docs/](../docs/) for technical documentation
- Open a GitHub issue for project-specific questions
- Join [Zama Discord](https://discord.com/invite/zama) for FHEVM questions
