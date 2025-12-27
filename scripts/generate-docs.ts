/**
 * @title Documentation Generator for FHEVM Examples
 * @notice Auto-generates markdown documentation from code annotations
 * @dev Extracts JSDoc/TSDoc comments and creates GitBook-compatible documentation
 */

import * as fs from "fs";
import * as path from "path";

interface DocExample {
  chapter: string;
  title: string;
  description: string;
  code: string;
  file: string;
}

interface ChapterSection {
  name: string;
  examples: DocExample[];
}

class DocumentationGenerator {
  private testDir: string;
  private docsDir: string;
  private examples: Map<string, DocExample[]> = new Map();

  constructor(testDir: string = "./test", docsDir: string = "./docs") {
    this.testDir = testDir;
    this.docsDir = docsDir;

    if (!fs.existsSync(this.docsDir)) {
      fs.mkdirSync(this.docsDir, { recursive: true });
    }
  }

  /**
   * Extract JSDoc/TSDoc comments and chapter tags from test files
   */
  private parseTestFile(filePath: string): void {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let currentExample: Partial<DocExample> | null = null;
    let docComment = "";
    let inDocBlock = false;
    let chapters: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract chapter tags from comments
      const chapterMatch = line.match(/@chapter:\s*([a-z-]+)/);
      if (chapterMatch) {
        chapters.push(chapterMatch[1]);
      }

      // Start of doc block
      if (line.includes("/**")) {
        inDocBlock = true;
        docComment = "";
        continue;
      }

      // End of doc block
      if (inDocBlock && line.includes("*/")) {
        inDocBlock = false;
        continue;
      }

      // Collect doc block content
      if (inDocBlock) {
        const cleanedLine = line.replace(/^\s*\*\s?/, "");
        docComment += cleanedLine + "\n";
      }

      // Extract describe/it blocks
      const describeMatch = line.match(/describe\s*\(\s*["']([^"']+)["']/);
      const itMatch = line.match(/it\s*\(\s*["']([^"']+)["']/);

      if (describeMatch || itMatch) {
        if (currentExample && docComment) {
          currentExample.description = docComment;
          currentExample.chapter = chapters.length > 0 ? chapters[0] : "general";
          this.storeExample(currentExample as DocExample);
        }

        currentExample = {
          title: describeMatch ? describeMatch[1] : itMatch?.[1] || "",
          file: path.basename(filePath),
          code: line.trim(),
        };

        docComment = "";
        chapters = [];
      }
    }

    if (currentExample && docComment) {
      currentExample.description = docComment;
      currentExample.chapter = chapters.length > 0 ? chapters[0] : "general";
      this.storeExample(currentExample as DocExample);
    }
  }

  /**
   * Store parsed example in chapter map
   */
  private storeExample(example: DocExample): void {
    if (!this.examples.has(example.chapter)) {
      this.examples.set(example.chapter, []);
    }
    this.examples.get(example.chapter)!.push(example);
  }

  /**
   * Generate markdown documentation for a chapter
   */
  private generateChapterDoc(chapter: string, examples: DocExample[]): string {
    const title = this.formatTitle(chapter);
    let md = `# ${title}\n\n`;
    md += `This chapter covers ${chapter} examples in the PrivateMuseumVisitTracker contract.\n\n`;

    examples.forEach((example) => {
      md += `## ${example.title}\n\n`;
      md += `${example.description}\n\n`;
      md += `**Source File:** \`${example.file}\`\n\n`;
      md += "```solidity\n";
      md += example.code + "\n";
      md += "```\n\n";
    });

    return md;
  }

  /**
   * Format chapter name to title case
   */
  private formatTitle(chapter: string): string {
    return chapter
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Generate SUMMARY.md for GitBook
   */
  private generateSummary(): string {
    let summary = "# Summary\n\n";
    summary += "## Overview\n";
    summary += "- [Introduction](README.md)\n\n";

    summary += "## Chapters\n";
    Array.from(this.examples.keys())
      .sort()
      .forEach((chapter) => {
        const title = this.formatTitle(chapter);
        summary += `- [${title}](./${chapter}.md)\n`;
      });

    summary += "\n## Appendix\n";
    summary += "- [Testing Guide](testing-guide.md)\n";
    summary += "- [API Reference](api-reference.md)\n";

    return summary;
  }

  /**
   * Generate API reference documentation
   */
  private generateAPIReference(): string {
    let api = "# API Reference\n\n";
    api += "## PrivateMuseumVisitTracker Contract\n\n";

    api += "### Core Functions\n\n";
    api += "#### registerVisitor(uint8 _age)\n";
    api += "Register a visitor with encrypted age.\n\n";
    api += "**Parameters:**\n";
    api += "- `_age`: Visitor's age (1-119)\n\n";
    api += "**Events:** VisitorRegistered\n\n";

    api += "#### createExhibition(string _name, ExhibitionType _type, uint32 _startDate, uint32 _endDate)\n";
    api += "Create a new exhibition (museum manager only).\n\n";
    api += "**Parameters:**\n";
    api += "- `_name`: Exhibition name\n";
    api += "- `_type`: Exhibition type (0=History, 1=Art, 2=Science, 3=Culture, 4=Technology, 5=Nature)\n";
    api += "- `_startDate`: Start timestamp\n";
    api += "- `_endDate`: End timestamp\n\n";
    api += "**Events:** ExhibitionCreated\n\n";

    api += "#### recordPrivateVisit(uint32 _exhibitionId, uint8 _satisfaction, uint32 _duration, uint8 _interestLevel)\n";
    api += "Record a private visit with encrypted feedback.\n\n";
    api += "**Parameters:**\n";
    api += "- `_exhibitionId`: Exhibition ID\n";
    api += "- `_satisfaction`: Satisfaction rating (1-10)\n";
    api += "- `_duration`: Visit duration in minutes\n";
    api += "- `_interestLevel`: Interest level (1-5)\n\n";
    api += "**Events:** PrivateVisitRecorded, SatisfactionRecorded\n\n";

    api += "### View Functions\n\n";
    api += "#### getPublicStats()\n";
    api += "Get overall public statistics.\n";
    api += "**Returns:** (uint32 totalExhibitions, uint32 totalRegisteredVisitors)\n\n";

    api += "#### getExhibitionInfo(uint32 _exhibitionId)\n";
    api += "Get exhibition information.\n";
    api += "**Returns:** (string name, ExhibitionType type, uint32 startDate, uint32 endDate, bool isActive, uint32 publicVisitorCount)\n\n";

    api += "#### getMyStats()\n";
    api += "Get visitor's own statistics.\n";
    api += "**Returns:** (bool isRegistered, uint32 registrationDate)\n\n";

    return api;
  }

  /**
   * Generate testing guide
   */
  private generateTestingGuide(): string {
    let guide = "# Testing Guide\n\n";
    guide += "## Running Tests\n\n";
    guide += "### Local Network Tests\n";
    guide += "```bash\nnpm test\n```\n\n";
    guide += "This runs the full test suite against the Hardhat mock FHEVM environment.\n\n";

    guide += "### Sepolia Testnet Tests\n";
    guide += "```bash\nnpm run test:sepolia\n```\n\n";
    guide += "This runs tests against the actual Sepolia network with FHEVM support.\n\n";

    guide += "## Test Categories\n\n";
    guide += "### 1. Deployment Tests\n";
    guide += "- Verify contract deployment\n";
    guide += "- Check initial values\n\n";

    guide += "### 2. Visitor Management\n";
    guide += "- Registration with encrypted age\n";
    guide += "- Age group categorization\n";
    guide += "- Duplicate prevention\n\n";

    guide += "### 3. Exhibition Management\n";
    guide += "- Create exhibitions\n";
    guide += "- Validate date ranges\n";
    guide += "- Toggle exhibition status\n\n";

    guide += "### 4. Visit Recording\n";
    guide += "- Record private visits\n";
    guide += "- Validate ratings\n";
    guide += "- Prevent duplicate visits\n\n";

    guide += "### 5. Privacy & Access Control\n";
    guide += "- Encrypted data storage\n";
    guide += "- Access control enforcement\n";
    guide += "- Statistics privacy\n\n";

    return guide;
  }

  /**
   * Parse all test files and generate documentation
   */
  public generate(): void {
    console.log("Generating documentation...");

    // Parse test files
    if (fs.existsSync(this.testDir)) {
      const files = fs.readdirSync(this.testDir);
      files.forEach((file) => {
        if (file.endsWith(".ts")) {
          const filePath = path.join(this.testDir, file);
          this.parseTestFile(filePath);
        }
      });
    }

    // Generate chapter documentation
    this.examples.forEach((examples, chapter) => {
      const docPath = path.join(this.docsDir, `${chapter}.md`);
      const markdown = this.generateChapterDoc(chapter, examples);
      fs.writeFileSync(docPath, markdown);
      console.log(`Generated ${docPath}`);
    });

    // Generate SUMMARY.md
    const summaryPath = path.join(this.docsDir, "SUMMARY.md");
    const summary = this.generateSummary();
    fs.writeFileSync(summaryPath, summary);
    console.log(`Generated ${summaryPath}`);

    // Generate API reference
    const apiPath = path.join(this.docsDir, "api-reference.md");
    const api = this.generateAPIReference();
    fs.writeFileSync(apiPath, api);
    console.log(`Generated ${apiPath}`);

    // Generate testing guide
    const testingPath = path.join(this.docsDir, "testing-guide.md");
    const testing = this.generateTestingGuide();
    fs.writeFileSync(testingPath, testing);
    console.log(`Generated ${testingPath}`);

    console.log("Documentation generation complete!");
  }
}

// Main execution
const generator = new DocumentationGenerator();
generator.generate();
