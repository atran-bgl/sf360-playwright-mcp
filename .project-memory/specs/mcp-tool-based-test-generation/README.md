# MCP Tool-Based Test Generation - Complete Specification

## Overview

This specification defines a **4-phase test generation system** where each phase is exposed as a dedicated MCP tool. Claude orchestrates the workflow by calling tools in sequence.

---

## Architecture

Instead of a single multi-phase prompt (1000+ lines), we have:

✅ **4 focused MCP tools** (200-400 lines each)
✅ **Modular & reusable** (can call tools independently)
✅ **Clear error attribution** (know which phase failed)
✅ **Intelligent orchestration** (Claude decides next steps)
✅ **Transparent workflow** (intermediate files persisted)

---

## Document Index

### 1. [00-architecture-overview.md](./00-architecture-overview.md)
**What it covers:**
- System architecture diagram
- Tool call sequence flowchart
- Data flow between phases
- Comparison: Single prompt vs MCP tools
- Implementation roadmap

**Read first:** Yes - provides context for all other specs

---

### 2. [01-test-plan-tool.md](./01-test-plan-tool.md)
**Tool:** `sf360-test-plan`

**What it covers:**
- Parse user test request
- Determine target page from menu-mapping.json
- Check requirements (fund/member)
- Authenticate and explore page with Playwright MCP
- Extract selectors for all interactive elements
- Generate structured test plan JSON

**Input:** User test description
**Output:** Plan JSON file + summary

**Key concepts:**
- Auto-detection from menu-mapping.json
- Page exploration with browser_snapshot
- Selector mapping to Playwright methods

---

### 3. [02-test-generate-tool.md](./02-test-generate-tool.md)
**Tool:** `sf360-test-generate`

**What it covers:**
- Read plan JSON from Phase 1
- Generate test file structure with imports
- Create setupTest() call with correct options
- Generate test data variables
- Convert plan steps to Playwright code
- Generate assertions
- Write test file to disk

**Input:** Plan JSON file
**Output:** Executable test file (.spec.js)

**Key concepts:**
- Playwright best practices (accessible selectors)
- Test data management (variables, not hardcoded)
- Code quality guidelines

---

### 4. [03-test-evaluate-tool.md](./03-test-evaluate-tool.md)
**Tool:** `sf360-test-evaluate`

**What it covers:**
- Returns prompt (not execution logic) for Claude to follow
- Instructs Claude to run test, debug with Playwright MCP, fix iteratively
- Smart limits: Max 20 attempts, max 5 per error type, stops if same error 3x
- Mandatory check-in at 10 attempts for user approval
- Error categorization: test_code (fix), app_bug (report), setup (guide)

**Input:** Test file from Phase 2
**Output:** Claude follows prompt → returns result (PASS/FAIL) with fixes applied

**Key concepts:**
- Prompt-based evaluation (not complex logic)
- Uses Claude's reasoning + Playwright MCP tools
- Flexible and intelligent debugging
- Handles any error type

---

### 5. [04-test-report-tool.md](./04-test-report-tool.md)
**Tool:** `sf360-test-report`

**What it covers:**
- Generate comprehensive markdown report
- Summarize execution result (PASS/FAIL)
- Document fixes applied
- Include evidence for failures
- Provide next steps for user

**Input:** Test file + plan + evaluation result
**Output:** Markdown report + one-line summary

**Key concepts:**
- Different report templates (PASS, FAIL, bug, setup)
- Actionable next steps
- Evidence documentation

---

### 6. [05-orchestration-guide.md](./05-orchestration-guide.md)
**Audience:** Claude (the orchestrator)

**What it covers:**
- When to call each tool
- How to handle errors (stop vs continue vs retry)
- Communication patterns (progress updates, error messages)
- Decision tree (when to proceed, when to ask user)
- Complete workflow examples

**Key concepts:**
- Tool call sequence
- Error handling patterns
- User interaction guidelines
- Progress communication

---

### 7. [06-mcp-server-integration.md](./06-mcp-server-integration.md)
**Audience:** Developer implementing the tools

**What it covers:**
- How to add tools to mcp-server/src/index.ts
- Prompt file creation and loading
- Tool registration with input schemas
- Testing the integration
- Build and deploy process

**Key concepts:**
- Tool definition in TypeScript
- Prompt variable injection
- Testing individual tools

---

### 8. [07-test-folder-structure.md](./07-test-folder-structure.md)
**Audience:** All (developers and users)

**What it covers:**
- Recommended folder structure for tests (organized by page/feature)
- File naming conventions
- Auto-organization logic in test-plan tool
- Test runner scripts (npm test, test:members, test:ui, etc.)
- Artifact cleanup script
- Playwright configuration
- Migration from flat structure

**Key concepts:**
- Scalable structure (100+ tests)
- Easy to run specific test groups
- Artifacts grouped with related tests
- Automated cleanup of old files

---

## Quick Start

### For Developers (Implementing Tools)

1. Read **00-architecture-overview.md** - Understand the system
2. Read **06-mcp-server-integration.md** - Implement the tools
3. Copy prompt content from tools 01-04 to templates/prompts/
4. Build and test

### For Claude (Orchestrating Workflow)

1. Read **00-architecture-overview.md** - Understand the flow
2. Read **05-orchestration-guide.md** - Learn when to call which tool
3. Follow the standard workflow in section "Standard Workflow (Happy Path)"

### For Users (Understanding the System)

1. Read **00-architecture-overview.md** - See the big picture
2. Read each tool spec (01-04) to understand what each phase does

---

## Tool Summary Table

| Tool | Purpose | Input | Output | Retryable |
|------|---------|-------|--------|-----------|
| **sf360-test-plan** | Analyze request, explore page, create plan | User spec, testName?, pageName? | Plan JSON + summary | No (ask user if ambiguous) |
| **sf360-test-generate** | Generate executable test code | Plan JSON path | Test file (.spec.js) | Yes (if plan exists) |
| **sf360-test-evaluate** | Run test, debug, fix errors | Test file path | Result (PASS/FAIL) + details | Yes (internal, max 20 attempts total, max 5 per error type) |
| **sf360-test-report** | Generate human-readable report | Test file, plan file, eval result | Report (.md) + summary | No |

---

## Workflow Diagram (Quick Reference)

```
User Request
    │
    ▼
sf360-test-plan
    │ (Creates plan JSON)
    ▼
sf360-test-generate
    │ (Creates test file)
    ▼
sf360-test-evaluate
    │ (Runs test, auto-fixes if needed)
    ▼
sf360-test-report
    │ (Creates report)
    ▼
Display Summary to User
```

---

## Error Handling Quick Reference

| Error Type | Category | Action |
|------------|----------|--------|
| Page not found | Plan | STOP - Ask user for clarification |
| Auth failed | Plan | STOP - Guide user to fix .env |
| Selector not found | Evaluate | AUTO-FIX - Update selector, retry |
| Element not visible | Evaluate | AUTO-FIX - Add wait, retry |
| Assertion failed | Evaluate | REPORT - Application bug detected |
| HTTP 500 | Evaluate | REPORT - API error detected |
| Missing TOTP_SECRET | Evaluate | STOP - Guide user to setup |
| Max retries reached | Evaluate | ASK USER - Manual intervention needed |

---

## File Artifacts Created

After running the full workflow, these files are created:

```
tests/
├── members-create.spec.js           ← Phase 2: Generated test
│
├── plans/
│   └── members-create-plan.json     ← Phase 1: Test plan
│
├── screenshots/
│   └── members-create-error-*.png   ← Phase 3: Debug screenshots (if failure)
│
└── reports/
    └── members-create-report.md     ← Phase 4: Final report
```

**File Cross-References:**

Each phase clearly references related files:

- **Phase 1 output:** `{ planFile: "tests/plans/members-create-plan.json" }`
- **Phase 2 output:** `{ testFile: "tests/members-create.spec.js", planFile: "..." }`
- **Phase 3 output:** `{ result: "PASS", testFile: "...", planFile: "..." }`
- **Phase 4 output:** `{ reportFile: "tests/reports/members-create-report.md" }`

Test files include references in header comments:
```javascript
// Test: members-create
// Plan: tests/plans/members-create-plan.json
// Generated: 2026-01-29
```

---

## Dependencies

### Required npm Packages
- `@playwright/test` - Test runner
- `@modelcontextprotocol/sdk` - MCP SDK
- `zod` - Schema validation (optional)

### Required MCP Servers
- **SF360 Playwright MCP** (this package) - Test generation tools
- **Playwright MCP** (separate) - Browser automation for exploration/debugging

### Required Files
- `config/menu-mapping.json` - Page metadata (requiresFund, requiresMember)
- `helpers/auth.js` - setupTest() function
- `.env` - Authentication credentials

---

## Next Steps

### Phase 1: Implementation
1. Create prompt files in templates/prompts/
2. Update mcp-server/src/index.ts with tool definitions
3. Build MCP server: `npm run build`
4. Test each tool individually

### Phase 2: Integration Testing
1. Test full workflow end-to-end
2. Test error scenarios (auth fail, page not found, etc.)
3. Test fix retries (wrong selectors, timing issues)

### Phase 3: Documentation
1. Update main README.md with new workflow
2. Create user guide for test generation
3. Add troubleshooting section

### Phase 4: Deployment
1. Publish npm package with new tools
2. Update CHANGELOG.md
3. Announce new feature to users

---

## Key Benefits

### For Users
✅ Automatic test generation from natural language
✅ Auto-fixing of common test issues (selectors, timing)
✅ Clear error messages with actionable next steps
✅ Complete reports with evidence and instructions

### For Developers
✅ Modular architecture (easy to maintain)
✅ Each phase is independently testable
✅ Clear separation of concerns
✅ Reusable tools (can call plan without generate, evaluate without plan)

### For Claude
✅ Focused prompts (easier to follow)
✅ Clear orchestration rules
✅ Intelligent error handling
✅ Transparent workflow (can inspect intermediate results)

---

## Questions?

Refer to individual spec files for detailed information:
- Tool behavior → 01-test-plan-tool.md through 04-test-report-tool.md
- Orchestration → 05-orchestration-guide.md
- Implementation → 06-mcp-server-integration.md
- Architecture → 00-architecture-overview.md

---

*Last updated: 2026-01-29*
