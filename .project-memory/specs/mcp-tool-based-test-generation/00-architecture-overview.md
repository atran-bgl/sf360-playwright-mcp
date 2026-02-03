# MCP Tool-Based Test Generation Architecture

## Overview

Instead of a single multi-phase agent, we expose **each phase as a dedicated MCP tool**. Claude acts as the orchestrator, calling tools in sequence based on the results of previous tools.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER REQUEST                                │
│   "Create test: Navigate to member page, create member, verify exists" │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLAUDE (Orchestrator)                            │
│                                                                           │
│  Decides which MCP tool to call based on:                                │
│  - User request                                                           │
│  - Current state/context                                                  │
│  - Results from previous tools                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  SF360 MCP       │   │  Playwright MCP  │   │  Project Files   │
│  Tools           │   │  Tools           │   │                  │
│                  │   │                  │   │  - tests/        │
│ 1. test-plan     │   │ - browser_*      │   │  - plans/        │
│ 2. test-generate │   │ - snapshot       │   │  - helpers/      │
│ 3. test-evaluate │   │ - click          │   │  - config/       │
│ 4. test-report   │   │ - fill_form      │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## Workflow: Tool Call Sequence

```
User: "Create test: Navigate to member page, create member, verify exists"
  │
  ▼
Claude: Calls sf360-test-plan
  │     Parameters:
  │     - spec: "Navigate to member page..."
  │     - testName: "create-member"
  │
  ▼
sf360-test-plan Tool Returns:
  │     {
  │       success: true,
  │       planFile: "tests/plans/create-member-plan.json",
  │       summary: {
  │         pageKey: "fund.members",
  │         requiresFund: true,
  │         testSteps: [
  │           { step: 1, description: "Authenticate and create fund", type: "setup" },
  │           { step: 2, description: "Navigate to members page", type: "setup" },
  │           { step: 3, description: "Click Add Member, fill form, click Save", type: "action" },
  │           { step: 4, description: "Verify member appears in list", type: "assertion" }
  │         ]
  │       }
  │     }
  │
  ▼
Claude: Reads plan summary, calls sf360-test-generate
  │     Parameters:
  │     - planFile: "tests/plans/create-member-plan.json"
  │
  ▼
sf360-test-generate Tool Returns:
  │     {
  │       success: true,
  │       testFile: "tests/create-member.spec.js",
  │       linesOfCode: 35
  │     }
  │
  ▼
Claude: Calls sf360-test-evaluate
  │     Parameters:
  │     - testFile: "tests/create-member.spec.js"
  │
  ▼
sf360-test-evaluate Tool Returns Prompt:
  │     "Run test, debug with Playwright MCP, fix iteratively..."
  │
  ▼
Claude: Follows prompt autonomously
  │     1. Runs: npx playwright test create-member.spec.js
  │     2. Fails: Selector "Save" not found
  │     3. Uses browser_snapshot to inspect page
  │     4. Finds correct selector: "Save Member"
  │     5. Fixes test file
  │     6. Runs test again → PASS
  │
  ▼
Claude: Returns evaluation result
  │     {
  │       success: true,
  │       result: "PASS",
  │       duration: 4523,
  │       attempts: 2,
  │       fixesApplied: ["Updated button selector to 'Save Member'"]
  │     }
  │
  ▼
Claude: Calls sf360-test-report
  │     Parameters:
  │     - testFile: "tests/create-member.spec.js"
  │     - planFile: "tests/plans/create-member-plan.json"
  │     - evaluationResult: { ... }
  │
  ▼
sf360-test-report Tool Returns:
  │     {
  │       success: true,
  │       reportFile: "tests/reports/create-member-report.md",
  │       summary: "✅ Test PASSED in 4.5s"
  │     }
  │
  ▼
Claude: Displays final report to user
  │     "✅ Test created and verified successfully!
  │
  │      📄 Test file: tests/create-member.spec.js
  │      ⏱️  Duration: 4.5s
  │      📊 Report: tests/reports/create-member-report.md
  │
  │      Run again: npx playwright test create-member"
```

---

## Key Innovation: Prompt-Based Evaluation

**Traditional approach:** Build complex logic to predict every error type and fix pattern.

**Our approach:** Give Claude a prompt with debugging instructions and let it use existing Playwright tools.

### Why This Works Better

**❌ Old way (Complex Logic):**
```typescript
if (error.includes('Selector not found')) {
  // Hardcoded fix pattern
  const newSelector = findCorrectSelector();
  updateTestFile(newSelector);
  retry();
} else if (error.includes('Timeout')) {
  // Another hardcoded pattern
  addWait();
  retry();
}
// What about errors we didn't predict?
```

**✅ New way (Intelligent Prompt):**
```markdown
Prompt: "Run the test. If it fails, use Playwright MCP to inspect
the page and fix the issue. Repeat until it passes."

Claude:
1. Runs test → Selector error
2. Uses browser_snapshot to see actual page
3. Compares, finds correct selector
4. Fixes test file
5. Runs again → Timing error
6. Adds appropriate wait
7. Runs again → PASS!

Handles ANY error type, not just predefined ones.
```

### Benefits

- **Flexible:** Handles unexpected errors
- **Simpler:** ~400 lines of prompt vs thousands of lines of logic
- **Smarter:** Uses Claude's reasoning, not rigid rules
- **Smart limits:** Max 20 attempts total, max 5 per error type prevents infinite loops
- **Mandatory check-ins:** User sees progress at 10 attempts, can approve continuation
- **Prevents thrashing:** Stops if same error occurs 3x in a row

---

## MCP Tool Definitions

### 1. `sf360-test-plan`

**Purpose:** Analyze user request, explore page, create test plan

**Parameters:**
```typescript
{
  spec: string;          // User's test description
  testName?: string;     // Optional test file name
  pageName?: string;     // Optional page hint
}
```

**Returns:**
```typescript
{
  success: boolean;
  planFile: string;      // Path to generated plan JSON
  summary: {
    pageKey: string;
    requiresFund: boolean;      // If true, setupTest() will create fund
    requiresMember: boolean;    // If true, setupTest() will create member (3-step process)
    stepsCount: number;
    testData: Record<string, any>;
  };
  error?: string;
}
```

**Note:** When `requiresMember: true`, the test will automatically create:
1. Contact (person) via `/entity/mvc/base/addPeople`
2. Member data retrieval via member code
3. Accumulation account via `/chart/chartmvc/MemberController/save`

See: `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`

**Prompt:** `.project-memory/prompts/test-plan-prompt.md`

---

### 2. `sf360-test-generate`

**Purpose:** Read plan and generate executable Playwright test

**Parameters:**
```typescript
{
  planFile: string;      // Path to plan JSON from test-plan tool
}
```

**Returns:**
```typescript
{
  success: boolean;
  testFile: string;      // Path to generated test file
  linesOfCode: number;
  error?: string;
}
```

**Prompt:** `.project-memory/prompts/test-generate-prompt.md`

---

### 3. `sf360-test-evaluate`

**Purpose:** Provide instructions for Claude to debug and fix test using Playwright tools

**How it works:**
- Tool returns a **prompt** (not execution logic)
- Claude reads prompt and autonomously:
  - Runs the test with Playwright
  - Uses Playwright MCP to debug (browser_snapshot, browser_navigate, etc.)
  - Fixes issues iteratively (max 20 attempts total, max 5 per error type)
  - Mandatory check-in at 10 attempts, stops if same error 3x in a row

**Parameters:**
```typescript
{
  testFile: string;  // Path to test file from test-generate tool
}
```

**Returns (Claude's result after following prompt):**
```typescript
{
  success: boolean;
  result: 'PASS' | 'FAIL';
  duration: number;       // ms
  attempts: number;       // How many fix attempts
  fixesApplied: string[]; // List of fixes made
  error?: {
    category: 'app_bug' | 'setup';
    message: string;
    evidence?: {
      screenshots: string[];
      logs: string[];
    };
  };
}
```

**Prompt:** `.project-memory/prompts/test-evaluate-prompt.md`

**Key Difference:** This tool **doesn't execute tests** - it gives Claude instructions to do so using existing Playwright tools. This makes it flexible, intelligent, and able to handle any error type.

---

### 4. `sf360-test-report`

**Purpose:** Generate human-readable test report

**Parameters:**
```typescript
{
  testFile: string;
  planFile: string;
  evaluationResult: object;  // Result from test-evaluate tool
}
```

**Returns:**
```typescript
{
  success: boolean;
  reportFile: string;        // Path to markdown report
  summary: string;           // One-line summary for display
}
```

**Prompt:** `.project-memory/prompts/test-report-prompt.md`

---

## Tool Communication via Files

Each tool reads/writes to project files to pass data. All phases use consistent naming: `{page}-{action}`

### Default Structure (Flat/Type-based)

```
tests/
├── members-create.spec.js               ← Generated by test-generate
├── members-edit.spec.js
├── transactions-add.spec.js
│
├── plans/                               ← All plans grouped
│   ├── members-create-plan.json         ← Generated by test-plan
│   ├── members-edit-plan.json
│   └── transactions-add-plan.json
│
├── screenshots/                         ← All screenshots grouped
│   ├── members-create-error-123.png     ← Generated by test-evaluate
│   └── transactions-add-error-456.png
│
├── reports/                             ← All reports grouped
│   ├── members-create-report.md         ← Generated by test-report
│   ├── members-edit-report.md
│   └── transactions-add-report.md
│
└── helpers/
    └── auth.js                          ← setupTest() helper
```

**setupTest() Return Context:**
```typescript
{
  baseUrl, firm, uid,               // Always present
  fundId?, fundName?,               // If requiresFund: true
  memberId?, memberCode?,           // If requiresMember: true
  memberName?, peopleId?            // (3-step creation process)
}
```

See: `.project-memory/specs/test-fixture-factory/active.auth-setup-test-api.md`

**File Naming Convention:** All related files share the same `{testName}` prefix:
- Test: `members-create.spec.js`
- Plan: `plans/members-create-plan.json`
- Report: `reports/members-create-report.md`
- Screenshots: `screenshots/members-create-error-*.png`

**Benefits:**
- ✅ Simple to implement and understand
- ✅ Standard Playwright pattern
- ✅ Works great for <30 tests
- ✅ Easy to find related files with consistent naming

**See:** 07-test-folder-structure.md for complete details and scripts.

---

## Error Handling: Tool-Level vs Orchestration-Level

### Tool-Level Errors

Each tool handles its own errors and returns structured error info:

```typescript
// test-plan tool fails to authenticate
{
  success: false,
  error: "Authentication failed: Invalid TOTP code",
  recovery: "Check TOTP_SECRET in .env"
}
```

### Orchestration-Level Errors

Claude decides whether to:
1. **Continue** - Non-critical error, proceed with warnings
2. **Retry** - Transient error, call tool again
3. **Stop** - Critical error, alert user and stop workflow

**Example:**
```javascript
// Test evaluation failed (app bug detected)
const evalResult = await sf360TestEvaluate({ testFile: "tests/create-member.spec.js" });

if (!evalResult.success && evalResult.error.category === 'app_bug') {
  // Stop workflow, alert user about bug
  await sf360TestReport({
    testFile: "tests/create-member.spec.js",
    evaluationResult: evalResult
  });

  return "⚠️ Test detected an application bug. See report for details.";
}
```

---

## Advantages of MCP Tool Architecture

### 1. **Modularity**
- Each tool has single responsibility
- Easy to test and debug individual tools
- Can call tools independently (e.g., regenerate test without re-planning)

### 2. **Reusability**
- `test-plan` can be called alone to explore pages
- `test-evaluate` can be called on existing tests
- `test-report` can regenerate reports from past evaluations

### 3. **Flexibility**
- Claude can adapt workflow based on results
- Can skip phases if not needed
- Can retry failed phases without restarting
- **test-evaluate uses Claude's judgment** - Smart limits (max 20 total, 5 per error type) prevent infinite loops while allowing thorough debugging

### 4. **Transparency**
- User can see which tool is being called
- Intermediate files are persisted (plans, screenshots, reports)
- Easy to debug issues by inspecting tool outputs

### 5. **Intelligent Evaluation**
- **test-evaluate returns prompt, not logic** - Claude debugs autonomously
- Smart limits: Max 20 attempts total, max 5 per error type, stops if same error 3x
- Uses existing Playwright MCP tools for debugging
- Mandatory check-in at 10 attempts, user approves continuation
- Handles any error type - not limited to predefined patterns

### 6. **Parallel Execution (Future)**
- Can run test-evaluate on multiple tests simultaneously
- Can generate multiple tests in parallel from same plan

---

## Comparison: Single Prompt vs MCP Tools

### Single Multi-Phase Prompt

```
❌ One massive prompt (1000+ lines)
❌ All phases executed even if early phase fails
❌ No intermediate inspection
❌ Hard to debug which phase caused error
❌ Cannot reuse individual phases
✅ Simpler for basic cases
```

### MCP Tool-Based

```
✅ 4 focused prompts (200-400 lines each)
✅ Stop early if phase fails
✅ Inspect intermediate results (plans, test files)
✅ Clear error attribution to specific tool
✅ Can call tools independently
✅ Claude orchestrates intelligently
✅ Evaluation uses Claude's reasoning (not complex logic)
✅ Leverages existing Playwright MCP for debugging
❌ More tools to maintain (but simpler individually)
```

---

## Implementation Plan

### Phase 1: Core MCP Tools (Priority)

1. **test-plan** tool
   - Define tool in `mcp-server/src/index.ts`
   - Create prompt: `templates/prompts/test-plan-prompt.md`
   - Implement plan generation logic

2. **test-generate** tool
   - Define tool in `mcp-server/src/index.ts`
   - Create prompt: `templates/prompts/test-generate-prompt.md`
   - Implement test generation logic

3. **test-evaluate** tool
   - Define tool in `mcp-server/src/index.ts`
   - Create prompt: `templates/prompts/test-evaluate-prompt.md`
   - **Note:** No complex logic - just returns prompt for Claude to follow

4. **test-report** tool
   - Define tool in `mcp-server/src/index.ts`
   - Create prompt: `templates/prompts/test-report-prompt.md`
   - Implement report generation

### Phase 2: Orchestration (Priority)

5. **Orchestration instructions**
   - Update `templates/prompts/base.md` or create new orchestration guide
   - Teach Claude when to call each tool
   - Define error handling strategies

### Phase 3: Enhancements (Future)

6. **Caching & Performance**
   - Cache page explorations
   - Reuse plans for similar tests

7. **Batch Operations**
   - Generate multiple tests from one plan
   - Parallel test evaluation

---

## Auth System Integration

The test generation system relies on the authentication and test fixture system for automatic fund/member creation:

### Key Components

1. **setupTest() Function** (`helpers/auth.js`)
   - Authenticates user via Cognito JWT + TOTP
   - Automatically creates fund if `requiresFund: true`
   - Automatically creates member if `requiresMember: true` (3-step process)
   - Returns context with IDs, names, and URLs
   - See: `.project-memory/specs/test-fixture-factory/active.auth-setup-test-api.md`

2. **Fund Creation** (via SF360 API)
   - Endpoint: `/d/Entities/addEntity`
   - Requires badge ID lookup
   - Calculates financial year automatically
   - See: `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`

3. **Member Creation** (3-step process via SF360 API)
   - Step 1: Create Contact → `peopleId` (via `/entity/mvc/base/addPeople`)
   - Step 2: Get Member Data → `memberCode` (via member data retrieval)
   - Step 3: Create Accumulation Account → `memberId` (via `/chart/chartmvc/MemberController/save`)
   - Returns: `{ memberId, memberCode, memberName, peopleId }`
   - See: `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`

4. **Test Data Generation** (factory functions)
   - `generateContactData()` - Unique person data with timestamps
   - `generateFundData()` - Unique fund names
   - `generateMemberData()` - Unique member data
   - See: `.project-memory/specs/test-fixture-factory/active.auth-data-factory.md`

### Integration Flow

```
Test Plan (requiresFund: true, requiresMember: true)
  ↓
Test Generate (includes setupTest() call with pageKey)
  ↓
Test Execute:
  1. setupTest() authenticates
  2. Checks menu-mapping.json for requirements
  3. Creates fund if needed (via API)
  4. Creates member if needed (via 3-step API process)
  5. Returns context with all IDs
  6. Navigates to target page
  ↓
Test proceeds with ctx.fundId, ctx.memberId, etc.
```

**Source of Truth:** All auth flow implementations are extracted from `noncompliance20260116` source code (working automation tests).

---

## Next Steps

This architecture will be detailed in separate specs:

### Test Generation Tools
1. **01-test-plan-tool.md** - test-plan tool specification
2. **02-test-generate-tool.md** - test-generate tool specification
3. **03-test-evaluate-tool.md** - test-evaluate tool specification
4. **04-test-report-tool.md** - test-report tool specification
5. **05-orchestration-guide.md** - How Claude orchestrates the workflow
6. **06-mcp-server-integration.md** - How to add tools to mcp-server/src/index.ts
7. **07-test-folder-structure.md** - File organization and naming conventions

### Auth & Test Fixtures
See `.project-memory/specs/test-fixture-factory/` for:
- `active.auth-setup-test-api.md` - setupTest() API contract
- `active.auth-fund-creation.md` - Fund and member creation via API
- `active.auth-data-factory.md` - Test data generation utilities

Each spec will include:
- Tool definition (name, parameters, return schema)
- Prompt content and instructions
- Implementation details
- Error handling
- Examples
