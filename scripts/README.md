# Automation Scripts

TypeScript-based CLI tools for managing and extending FHEVM examples.

## Available Scripts

### generate-docs.ts

Automatically generates markdown documentation from code annotations.

**Usage:**
```bash
npm run generate-docs
# or
npx ts-node scripts/generate-docs.ts
```

**Features:**
- Extracts JSDoc/TSDoc comments from test files
- Parses chapter tags from code
- Generates GitBook-compatible markdown
- Creates API reference
- Generates testing guides

**Output:**
- `docs/SUMMARY.md` - GitBook table of contents
- `docs/{chapter}.md` - Chapter documentation
- `docs/api-reference.md` - Complete API reference
- `docs/testing-guide.md` - Testing documentation

**Chapter Tags:**
Organize documentation with chapter tags in comments:

```typescript
/**
 * @title Test Title
 * @notice Description
 * @dev Technical details
 *
 * @chapter: access-control
 */
```

Supported chapters:
- access-control
- encryption
- decryption
- privacy-patterns
- statistics-aggregation
- advanced-patterns

### create-fhevm-example.ts

Creates new FHEVM example repositories from a template.

**Usage:**
```bash
npm run create-example -- --name "ExampleName" --category "encryption"
# or
npx ts-node scripts/create-fhevm-example.ts --name "ExampleName" --category "encryption"
```

**Options:**
- `--name` (required): Example name
- `--category` (required): Example category
- `--description` (optional): Example description
- `--contractName` (optional): Custom contract name
- `--outputDir` (optional): Output directory

**Example:**
```bash
npm run create-example -- --name "EncryptedVoting" --category "encryption" --description "Privacy-preserving voting system"
```

**Generated Files:**
- `contracts/{ContractName}.sol` - Smart contract template
- `test/{ContractName}.ts` - Test suite
- `deploy/01-deploy-contract.ts` - Deployment script
- `hardhat.config.ts` - Hardhat configuration
- `package.json` - Dependencies
- `README.md` - Project documentation
- Configuration files (.eslintrc, .prettierrc, etc.)

**Benefits:**
- Scaffold new examples quickly
- Consistent project structure
- Ready for immediate development
- Includes all necessary configuration

## Documentation Structure

Generated documentation follows this structure:

```
docs/
├── SUMMARY.md                    # GitBook table of contents
├── api-reference.md              # Complete API documentation
├── testing-guide.md              # Testing instructions
├── access-control.md             # Access control examples
├── encryption.md                 # Encryption pattern examples
├── decryption.md                 # Decryption pattern examples
└── ...                          # Other chapter files
```

## Extending the Generator

To add new documentation generators:

1. Create a new method in the `DocumentationGenerator` class
2. Call it from the `generate()` method
3. Output files to the `docsDir`

Example:
```typescript
private generateCustomDoc(): string {
  let doc = "# Custom Documentation\n\n";
  // ... build your documentation
  return doc;
}

// Then in generate():
const customPath = path.join(this.docsDir, "custom.md");
const custom = this.generateCustomDoc();
fs.writeFileSync(customPath, custom);
```

## Integration with npm

Add scripts to `package.json` for easy access:

```json
{
  "scripts": {
    "generate-docs": "npx ts-node scripts/generate-docs.ts",
    "generate-all-docs": "npx ts-node scripts/generate-docs.ts --all"
  }
}
```

Then run:
```bash
npm run generate-docs
```

## Environment Requirements

- Node.js >= 20
- TypeScript support (`ts-node`)
- @types/node

## Best Practices

1. **Keep comments updated** - Documentation is only as good as your comments
2. **Use consistent chapter tags** - Helps organize documentation
3. **Include examples** - Show practical usage of features
4. **Document edge cases** - Explain non-obvious behavior
5. **Link to related docs** - Help readers find related information

## Troubleshooting

**No documentation generated:**
- Check that test files exist in `test/` directory
- Verify files end with `.ts`
- Ensure JSDoc comments are properly formatted

**Missing chapters:**
- Add `@chapter:` tags to your test file comments
- Use consistent chapter names across files
- Run `generate-docs` again

**GitBook integration issues:**
- Verify `SUMMARY.md` is in the docs root
- All referenced files must exist
- File paths should use relative paths

## Contributing

When adding new test cases, include:
1. Clear JSDoc comments explaining the test
2. Chapter tag for categorization
3. Comments in the test code itself
4. Description of what is being tested

Example:
```typescript
/**
 * @title Visitor Registration
 * @notice Tests the visitor registration functionality with encrypted age
 * @dev Demonstrates encryption and access control patterns
 *
 * @chapter: encryption
 */
describe("Visitor Registration", function () {
  it("should register visitor with encrypted age", async function () {
    // Test implementation
  });
});
```

---

Generated documentation is managed automatically. Do not edit generated files directly.
