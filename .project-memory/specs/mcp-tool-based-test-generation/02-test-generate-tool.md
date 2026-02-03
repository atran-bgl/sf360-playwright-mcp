# Tool Spec: `sf360-test-generate`

## Purpose

Read test plan from `sf360-test-plan` tool and generate a complete, executable Playwright test file with setupTest(), test data, actions, and assertions.

---

## MCP Tool Definition

### Tool Name
`sf360-test-generate`

### Description
```
Generate executable Playwright test code from a structured test plan.
Reads plan JSON, creates test file with setupTest(), actions, and assertions.
```

### Input Schema

```typescript
{
  planFile: string;      // REQUIRED: Path to plan JSON from test-plan tool
}
```

**Examples:**
```javascript
{ planFile: "tests/plans/create-member-plan.json" }
```

### Output Schema

```typescript
{
  success: boolean;
  testFile: string;           // Path to generated test file
  planFile: string;           // Path to plan file (for next phases)
  linesOfCode: number;        // Size metric
  testDescription: string;    // Human-readable test description
  error?: {
    code: string;
    message: string;
    recovery?: string;
  };
}
```

**Success Example:**
```json
{
  "success": true,
  "testFile": "tests/members-create.spec.js",
  "planFile": "tests/plans/members-create-plan.json",
  "linesOfCode": 35,
  "testDescription": "should create new member and verify existence"
}
```

**Error Example:**
```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan file not found: tests/plans/create-member-plan.json",
    "recovery": "Run sf360-test-plan tool first to create the plan"
  }
}
```

---

## Prompt Content

**File:** `templates/prompts/test-generate-prompt.md`

```markdown
# SF360 Test Code Generator

You are generating executable Playwright test code from a structured test plan.

## Your Task

Given a test plan JSON file, you will:
1. Read and validate the plan
2. Generate test file structure with imports
3. Create setupTest() call with correct options
4. Generate test data variables
5. Convert test steps to Playwright code
6. Generate assertions
7. Write test file to disk

## Inputs

You received:
- **planFile**: {{PLAN_FILE}}

## Step-by-Step Instructions

### Step 1: Read Plan File

```javascript
const fs = require('fs');
const plan = JSON.parse(fs.readFileSync('{{PLAN_FILE}}', 'utf8'));
```

**Validate required fields:**
- `plan.metadata.testName`
- `plan.targetPage.pageKey`
- `plan.requirements.setupOptions`
- `plan.testSteps`
- `plan.testData`

If missing, return error.

### Step 2: Generate Test File Header

**Include file cross-references as comments:**

```javascript
// Test: members-create
// Plan: tests/plans/members-create-plan.json
// Generated: 2026-01-29
//
// Description: Create new member and verify in table

const { test, expect } = require('@playwright/test');
const { setupTest } = require('../helpers/auth');

test.describe('{SuiteName}', () => {
  test('{testDescription}', async ({ page }) => {
    // Test code here
  });
});
```

**Header Comments (REQUIRED):**
- `Test:` - Test name (e.g., "members-create")
- `Plan:` - Path to plan file (e.g., "tests/plans/members-create-plan.json")
- `Generated:` - ISO date (e.g., "2026-01-29")
- `Description:` - Brief human-readable description

**Naming Rules:**
- **SuiteName**: Derived from page section
  - fund.members → "Member Management"
  - fund.transactions → "Transaction Management"
  - firm.dashboard → "Dashboard Operations"

- **testDescription**: Start with "should" + action + outcome
  - "should create new member and verify existence"
  - "should edit transaction and verify updated balance"
  - "should delete fund and verify removal"

### Step 3: Generate setupTest() Call

Read from plan:
```javascript
const { requirements, targetPage } = plan;
```

Generate:
```javascript
    // Setup: Authenticate and prepare test environment
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      pageKey: '{targetPage.pageKey}'
    });

    console.log(`Testing with fund: ${ctx.fundName} (${ctx.fundId})`);
```

**If requiresMember: true, also log member info:**
```javascript
    console.log(`Testing with fund: ${ctx.fundName} (${ctx.fundId})`);
    console.log(`Testing with member: ${ctx.memberName} (${ctx.memberId})`);
```

**Important:**
- Use `pageKey` for auto-detection (don't add fund/member options manually)
- Include console.log for debugging (fund always, member if created)
- Comment should be concise

**See Also:**
- setupTest() return values: `.project-memory/specs/test-fixture-factory/active.auth-setup-test-api.md`
- Test data generation: `.project-memory/specs/test-fixture-factory/active.auth-data-factory.md`

### Step 4: Generate Test Data

Read from plan:
```javascript
const { testData } = plan;
```

Generate:
```javascript
    // Test data
    const testData = {
      firstName: 'AutoTest',
      lastName: `Member${Date.now()}`,
      dateOfBirth: '1985-05-15'
    };
```

**Dynamic Values:**
- Names: Use timestamp for uniqueness (Date.now())
- Emails: `test${Date.now()}@example.com`
- IDs: `AUTO${Date.now()}`

**User-Specified Values:**
If plan has specific values, use them:
```javascript
    const testData = {
      firstName: 'John',     // From plan
      lastName: 'Doe',       // From plan
      dateOfBirth: '1985-05-15'
    };
```

### Step 5: Generate Test Actions

Read from plan:
```javascript
const { testSteps } = plan;
```

**Filter setup steps (handled by setupTest):**
```javascript
const codeSteps = testSteps.filter(s => s.type !== 'setup');
// Generate code for 'action' and 'assertion' type steps only
```

**Generate code for each step:**

#### Click Actions
```javascript
    // Step {N}: {description}
    await {method}.click();
```

Example:
```javascript
    // Step 3: Open member form
    await page.getByRole('button', { name: 'Add Member' }).click();
```

#### Fill Actions
```javascript
    await {method}.fill({value});
```

Example:
```javascript
    await page.getByLabel('First Name').fill(testData.firstName);
    await page.getByLabel('Last Name').fill(testData.lastName);
```

**Important:** Use testData variables, not hardcoded strings.

#### Select Actions
```javascript
    await {method}.selectOption('{value}');
```

#### Wait Actions (Add When Needed)
```javascript
    await page.waitForLoadState('networkidle');
```

Add after:
- Form submissions
- Page navigation
- AJAX calls

### Step 6: Generate Assertions

Read assertion steps from plan:
```javascript
const verifySteps = testSteps.filter(s => s.action === 'verify');
```

**Visibility Assertions:**
```javascript
    // Step {N}: {description}
    await expect({selector}).toBeVisible();
```

Example:
```javascript
    // Step 4: Verify member exists
    await expect(page.getByText(`${testData.firstName} ${testData.lastName}`)).toBeVisible();
```

**Text Content Assertions:**
```javascript
    await expect({selector}).toHaveText('{expected}');
```

**Count Assertions:**
```javascript
    await expect({selector}).toHaveCount({number});
```

**Multiple Assertions:**
If multiple verifications needed:
```javascript
    // Verify member exists in table
    await expect(page.getByText(`${testData.firstName} ${testData.lastName}`)).toBeVisible();

    // Verify success message
    await expect(page.getByText('Member created successfully')).toBeVisible();
```

### Step 7: Format Code

**Indentation:** 2 spaces

**Structure:**
```javascript
test('description', async ({ page }) => {
  // Setup
  const ctx = await setupTest(...);

  // Test data
  const testData = {...};

  // Actions
  await page...
  await page...

  // Assertions
  await expect(...).toBeVisible();
});
```

### Step 8: Write Test File

**File path:**
```javascript
const testFile = `tests/${plan.metadata.testName}.spec.js`;
```

**Write:**
```javascript
fs.writeFileSync(testFile, generatedCode, 'utf8');
```

### Step 9: Return Result

**Include both test file and plan file for next phases:**

```json
{
  "success": true,
  "testFile": "tests/members-create.spec.js",
  "planFile": "tests/plans/members-create-plan.json",
  "linesOfCode": 35,
  "testDescription": "should create new member and verify existence"
}
```

**Why include planFile?**
- test-evaluate tool needs it for context
- test-report tool needs both testFile and planFile
- Maintains clear cross-references between phases

## Code Quality Rules

### 1. Use Accessible Selectors (Priority Order)

1. **getByRole()** - Best for buttons, inputs, links
   ```javascript
   page.getByRole('button', { name: 'Save' })
   ```

2. **getByLabel()** - Best for form fields
   ```javascript
   page.getByLabel('First Name')
   ```

3. **getByText()** - Best for text content
   ```javascript
   page.getByText('John Doe')
   ```

4. **locator()** - Last resort
   ```javascript
   page.locator('table.members-table')
   ```

### 2. Always Use `await`

```javascript
// ✅ Correct
await page.click('button');
await expect(page.getByText('Success')).toBeVisible();

// ❌ Wrong
page.click('button');
expect(page.getByText('Success')).toBeVisible();
```

### 3. Use Variables, Not Hardcoded Values

```javascript
// ✅ Good
const testData = { name: 'John Doe' };
await page.fill('input', testData.name);
await expect(page.getByText(testData.name)).toBeVisible();

// ❌ Bad
await page.fill('input', 'John Doe');
await expect(page.getByText('John Doe')).toBeVisible();
```

### 4. Add Waits When Needed

```javascript
// After form submission
await page.click('button[type="submit"]');
await page.waitForLoadState('networkidle');

// Before slow assertion
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
```

### 5. Comments

```javascript
// ✅ Good - Describes what, not how
// Step 3: Create new member
await page.click('button');

// ❌ Too verbose
// Click the Add Member button to open the form where we will fill in details
await page.click('button');
```

## Error Handling

### Error: Plan File Not Found

```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan file not found: tests/plans/xyz-plan.json",
    "recovery": "Run sf360-test-plan tool first to create the plan"
  }
}
```

### Error: Invalid Plan Structure

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PLAN",
    "message": "Plan missing required field: testSteps",
    "recovery": "Plan file may be corrupted. Re-run sf360-test-plan tool."
  }
}
```

### Error: Test File Already Exists

**Action:** Append timestamp to filename

```javascript
if (fs.existsSync(testFile)) {
  testFile = `tests/${testName}-${Date.now()}.spec.js`;
}
```

Return warning:
```json
{
  "success": true,
  "testFile": "tests/create-member-1738152600000.spec.js",
  "warning": "Original filename existed, appended timestamp"
}
```

## Tools You Have Access To

- **Read**: Read plan JSON file
- **Write**: Write test file to disk

## Important Rules

1. **Read plan first** - Validate structure before generating
2. **Use plan's selectors** - Don't create new selectors
3. **Follow Playwright best practices** - Accessible selectors, proper waits
4. **Keep it simple** - Don't add unnecessary complexity
5. **Test data variables** - Never hardcode values in multiple places
6. **Format consistently** - 2-space indentation, logical grouping

## Complete Example

**Input Plan (Summary):**
```json
{
  "metadata": { "testName": "create-member" },
  "targetPage": { "pageKey": "fund.members" },
  "requirements": { "needsFund": true },
  "testSteps": [
    { "step": 1, "action": "setup", "type": "setup" },
    {
      "step": 3,
      "action": "create_member",
      "type": "action",
      "subSteps": [
        { "action": "click", "method": "page.getByRole('button', { name: 'Add Member' })" },
        { "action": "fill", "method": "page.getByLabel('First Name')", "value": "AutoTest" },
        { "action": "fill", "method": "page.getByLabel('Last Name')", "value": "Member1738152600000" },
        { "action": "click", "method": "page.getByRole('button', { name: 'Save' })" }
      ]
    },
    {
      "step": 4,
      "action": "verify",
      "type": "assertion",
      "assertion": { "method": "await expect(page.getByText('...')).toBeVisible()" }
    }
  ],
  "testData": { "member": { "firstName": "AutoTest", "lastName": "Member1738152600000" } }
}
```

**Generated Test File:**
```javascript
const { test, expect } = require('@playwright/test');
const { setupTest } = require('./helpers/auth');

test.describe('Member Management', () => {
  test('should create new member and verify existence', async ({ page }) => {
    // Setup: Authenticate and prepare test environment
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      pageKey: 'fund.members'
    });

    console.log(`Testing with fund: ${ctx.fundName} (${ctx.fundId})`);

    // Test data
    const testData = {
      firstName: 'AutoTest',
      lastName: `Member${Date.now()}`,
      dateOfBirth: '1985-05-15'
    };

    // Step 3: Create new member
    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.getByLabel('First Name').fill(testData.firstName);
    await page.getByLabel('Last Name').fill(testData.lastName);
    await page.getByRole('button', { name: 'Save' }).click();

    // Step 4: Verify member exists
    await expect(page.getByText(`${testData.firstName} ${testData.lastName}`)).toBeVisible();
  });
});
```

**Output:**
```json
{
  "success": true,
  "testFile": "tests/create-member.spec.js",
  "planFile": "tests/plans/create-member-plan.json",
  "linesOfCode": 28,
  "testDescription": "should create new member and verify existence"
}
```

---

## Example 2: Test with Member Creation (requiresMember: true)

**Input Plan (Summary):**
```json
{
  "metadata": { "testName": "view-member-details" },
  "targetPage": {
    "pageKey": "fund.member_details",
    "requiresFund": true,
    "requiresMember": true
  },
  "requirements": { "needsFund": true, "needsMember": true },
  "testSteps": [
    { "step": 1, "action": "setup", "type": "setup", "description": "Authenticate, create fund and member" },
    { "step": 2, "action": "navigate", "type": "setup" },
    {
      "step": 3,
      "action": "verify",
      "type": "assertion",
      "description": "Verify member name displayed",
      "assertion": {
        "method": "await expect(page.getByRole('heading', { level: 1 })).toContainText(ctx.memberName)"
      }
    }
  ],
  "testData": {}
}
```

**Generated Test File:**
```javascript
// Test: view-member-details
// Plan: tests/plans/view-member-details-plan.json
// Generated: 2026-01-30
//
// Description: View member details page and verify member information

const { test, expect } = require('@playwright/test');
const { setupTest } = require('./helpers/auth');

test.describe('Member Management', () => {
  test('should display member details correctly', async ({ page }) => {
    // Setup: Authenticate and prepare test environment
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      pageKey: 'fund.member_details'
    });

    console.log(`Testing with fund: ${ctx.fundName} (${ctx.fundId})`);
    console.log(`Testing with member: ${ctx.memberName} (${ctx.memberId})`);

    // Step 3: Verify member name displayed
    await expect(page.getByRole('heading', { level: 1 })).toContainText(ctx.memberName);

    // Verify member is visible in page
    await expect(page.getByText(ctx.memberName)).toBeVisible();
  });
});
```

**Output:**
```json
{
  "success": true,
  "testFile": "tests/view-member-details.spec.js",
  "planFile": "tests/plans/view-member-details-plan.json",
  "linesOfCode": 23,
  "testDescription": "should display member details correctly"
}
```
```

---

## Implementation Notes

### Tool Registration (mcp-server/src/index.ts)

```typescript
server.tool(
  'sf360-test-generate',
  'Generate executable Playwright test from plan',
  {
    planFile: z.string().describe('Path to plan JSON file'),
  },
  async ({ planFile }) => {
    // Load prompt
    const promptPath = path.join(__dirname, '../prompts/test-generate-prompt.md');
    let prompt = fs.readFileSync(promptPath, 'utf8');

    // Inject variable
    prompt = prompt.replace(/\{\{PLAN_FILE\}\}/g, planFile);

    return {
      content: [{ type: 'text', text: prompt }]
    };
  }
);
```

---

## Usage Example (Claude's Perspective)

```
[Previous: sf360-test-plan completed successfully]

Claude: Plan created. Now I'll generate the test code.
[Calls sf360-test-generate with planFile="tests/plans/create-member-plan.json"]

Tool returns:
{
  "success": true,
  "testFile": "tests/create-member.spec.js",
  "linesOfCode": 28
}

Claude: ✅ Test generated!
- File: tests/create-member.spec.js
- 28 lines of code
- Next, I'll run the test to verify it works...

[Calls sf360-test-evaluate tool]
```

---

## Dependencies

### Required Files
- Plan JSON from `sf360-test-plan` tool
- `helpers/auth.js` (referenced in test)

### Required npm Packages
- `@playwright/test` (used in generated test)

---

## Testing the Tool

### Test Case 1: Valid Plan
```json
{ "planFile": "tests/plans/valid-plan.json" }
```
**Expected:** Test file generated successfully

### Test Case 2: Missing Plan
```json
{ "planFile": "tests/plans/nonexistent.json" }
```
**Expected:** Error with PLAN_NOT_FOUND code

### Test Case 3: Corrupted Plan
```json
{ "planFile": "tests/plans/corrupted.json" }
```
**Expected:** Error with INVALID_PLAN code

---

## Next Tool

Test file → **sf360-test-evaluate** (03-test-evaluate-tool.md)
