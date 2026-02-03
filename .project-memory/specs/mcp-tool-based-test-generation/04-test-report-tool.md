# Tool Spec: `sf360-test-report`

## Purpose

Generate a comprehensive, human-readable test report summarizing the entire test generation workflow, including plan, generated code, evaluation results, and next steps.

---

## MCP Tool Definition

### Tool Name
`sf360-test-report`

### Description
```
Generate comprehensive test report with execution summary, test details,
fixes applied, evidence of failures, and next steps for the user.
```

### Input Schema

```typescript
{
  testFile: string;           // REQUIRED: Path to test file
  planFile: string;           // REQUIRED: Path to plan JSON
  evaluationResult: object;   // REQUIRED: Result from test-evaluate tool
}
```

**Examples:**
```javascript
{
  testFile: "tests/members-create.spec.js",
  planFile: "tests/plans/members-create-plan.json",
  evaluationResult: {
    success: true,
    result: "PASS",
    testFile: "tests/members-create.spec.js",
    planFile: "tests/plans/members-create-plan.json",
    duration: 4523,
    attempts: 2,
    fixesApplied: ["Updated selector", "Added wait"]
  }
}
```

### Output Schema

```typescript
{
  success: boolean;
  reportFile: string;        // Path to generated markdown report
  summary: string;           // One-line summary for Claude to display
}
```

**Success Example:**
```json
{
  "success": true,
  "reportFile": "tests/reports/members-create-report.md",
  "summary": "✅ Test PASSED in 4.5s (2 auto-fixes applied)"
}
```

---

## Prompt Content

**File:** `templates/prompts/test-report-prompt.md`

```markdown
# SF360 Test Report Generator

You are generating a comprehensive test execution report.

## Your Task

Create a detailed markdown report summarizing:
1. Test metadata (name, page, requirements)
2. Execution result (PASS/FAIL, duration, retries)
3. Fixes applied (if any)
4. Evidence (screenshots, logs for failures)
5. Next steps for user

## Inputs

You received:
- **testFile**: {{TEST_FILE}}
- **planFile**: {{PLAN_FILE}}
- **evaluationResult**: {{EVALUATION_RESULT}}

## Step-by-Step Instructions

### Step 1: Read Inputs

```javascript
const plan = JSON.parse(fs.readFileSync('{{PLAN_FILE}}', 'utf8'));
const testCode = fs.readFileSync('{{TEST_FILE}}', 'utf8');
const evaluation = JSON.parse('{{EVALUATION_RESULT}}');
```

### Step 2: Determine Report Tone

**If PASS:**
- Positive, celebratory tone ✅
- Highlight efficiency (duration, auto-fixes)
- Provide run instructions

**If FAIL:**
- Neutral, helpful tone ⚠️
- Categorize error clearly
- Provide actionable next steps
- Include evidence

### Step 3: Generate Report Structure

Create markdown report with sections:

```markdown
# Test Report: {TestName}

**Status**: {PASS/FAIL Emoji + Text}
**Generated**: {Timestamp}
**Duration**: {Duration}

---

## Test Overview

**Page**: {PageName} ({PageKey})
**Requires Fund**: {Yes/No}
**Requires Member**: {Yes/No}
**Test Description**: {Original user spec}

---

## Execution Result

{Result details based on PASS/FAIL}

---

## Test Details

{Code snippet + steps summary}

---

## Next Steps

{Instructions for user}

---

## Artifacts

- Plan: {planFile}
- Test: {testFile}
- Screenshots: {if any}
```

### Step 4: Build Report Sections

#### Section: Test Overview

```markdown
## Test Overview

**Page**: Members (fund.members)
**Requires Fund**: Yes
**Requires Member**: No
**Original Request**: "Navigate to member page and create a new member, verify that the member exists"

**Test Steps**:
1. Setup: Authenticate and create fund (automated)
2. Navigate: Go to members page (automated)
3. Create: Add new member via form
4. Verify: Check member appears in list
```

#### Section: Execution Result (PASS)

```markdown
## Execution Result

✅ **Test PASSED**

**Duration**: 4.5 seconds
**Attempts**: 3 (2 auto-fixes applied)

### Fixes Applied

1. **Selector Update**
   - Issue: Button selector 'Save' not found
   - Fix: Updated to 'Save Member'

2. **Timing Fix**
   - Issue: Element not visible after submission
   - Fix: Added wait for network idle
```

#### Section: Execution Result (FAIL - Test Code)

```markdown
## Execution Result

❌ **Test FAILED** (Test Code Issue)

**Duration**: 6.2 seconds
**Attempts**: 3 (max retries reached)

### Error Details

**Category**: Test Code Issue
**Message**: Could not locate element after 3 fix attempts

**Last Error**:
```
Error: locator.click: Selector "button.submit" not found
```

### Suggested Actions

1. Manually inspect the page to verify element exists
2. Check if element is in an iframe
3. Run test with `--debug` flag: `npx playwright test create-member --debug`
```

#### Section: Execution Result (FAIL - App Bug)

```markdown
## Execution Result

⚠️ **Test FAILED** (Application Bug Detected)

**Duration**: 5.2 seconds
**Attempts**: 1 (no retries - application issue)

### Bug Details

**Message**: Member 'John Doe' not visible after creation

**Evidence**:
- POST /api/members → 200 OK
- Member list did not update after successful API call
- Expected: "John Doe" to be visible in table
- Actual: Member not found in DOM

**Screenshots**:
- [Error State](../screenshots/error-1738152600000.png)

### Recommended Actions

1. Verify member was actually created in database
2. Check if frontend refresh is triggered after API call
3. Inspect browser console for JavaScript errors
4. Report bug to development team with evidence above
```

#### Section: Execution Result (FAIL - Setup)

```markdown
## Execution Result

🔧 **Test FAILED** (Setup Issue)

**Duration**: 1.0 second
**Error**: Authentication failed: TOTP_SECRET not found in .env

### How to Fix

1. Create or update `.env` file with:
   ```
   USERNAME=your-username
   USER_PASSWORD=your-password
   TOTP_SECRET=your-totp-secret
   FIRM=your-firm-code
   BASE_URL=https://sf360.uat.bgl360.com.au
   ```

2. Verify setup:
   ```bash
   node helpers/verify-setup.js
   ```

3. Re-run test:
   ```bash
   npx playwright test create-member
   ```
```

#### Section: Test Details

```markdown
## Test Details

**Test File**: `tests/create-member.spec.js`

**Code Summary**:
- Lines of code: 28
- Uses setupTest() for authentication
- Creates unique member with timestamp
- Verifies member appears in list

**Key Actions**:
1. Click "Add Member" button
2. Fill first name: "AutoTest"
3. Fill last name: "Member{timestamp}"
4. Click "Save Member" button
5. Verify member name is visible
```

#### Section: Next Steps (PASS)

```markdown
## Next Steps

### Run Test Again

```bash
npx playwright test create-member
```

### Run All Tests

```bash
npx playwright test
```

### Run with UI Mode (Interactive)

```bash
npx playwright test create-member --ui
```

### Debug Test

```bash
npx playwright test create-member --debug
```

### View Report

```bash
npx playwright show-report
```
```

#### Section: Next Steps (FAIL)

```markdown
## Next Steps

### If Test Code Issue

1. Review the failing selector in `tests/create-member.spec.js`
2. Run test with debug mode: `npx playwright test create-member --debug`
3. Use Playwright Inspector to find correct selector
4. Update test code and re-run

### If Application Bug

1. Report bug to development team
2. Include screenshots and logs from this report
3. Wait for fix before re-running test
4. Consider adding this as a known issue

### If Setup Issue

1. Follow setup instructions above
2. Run `node helpers/verify-setup.js` to verify
3. Re-run test after fixing configuration
```

#### Section: Artifacts

```markdown
## Artifacts

- **Plan**: `tests/plans/create-member-plan.json`
- **Test**: `tests/create-member.spec.js`
- **Report**: `tests/reports/create-member-report.md`
- **Screenshots**: `tests/screenshots/error-1738152600000.png` *(if failure)*

---

*Report generated by SF360 Playwright MCP - Test Generation Agent*
```

### Step 5: Write Report File

**File path:**
```javascript
const reportFile = `tests/reports/${testName}-report.md`;
```

**Create directory if needed:**
```javascript
const reportsDir = 'tests/reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
```

**Write report:**
```javascript
fs.writeFileSync(reportFile, reportContent, 'utf8');
```

### Step 6: Generate Summary for Claude

**If PASS:**
```javascript
const summary = `✅ Test PASSED in ${duration}s${retries > 0 ? ` (${retries} auto-fixes applied)` : ''}`;
```

**If FAIL (test_code):**
```javascript
const summary = `❌ Test FAILED (test code issue) - Could not fix after ${retries} attempts`;
```

**If FAIL (app_bug):**
```javascript
const summary = `⚠️ Test FAILED (application bug detected) - See report for evidence`;
```

**If FAIL (setup):**
```javascript
const summary = `🔧 Test FAILED (setup issue) - ${error.message}`;
```

### Step 7: Return Result

```json
{
  "success": true,
  "reportFile": "tests/reports/create-member-report.md",
  "summary": "✅ Test PASSED in 4.5s (2 auto-fixes applied)"
}
```

## Report Templates by Scenario

### Template 1: First-Time Pass (No Fixes)

```markdown
# Test Report: create-member

**Status**: ✅ PASSED
**Generated**: 2026-01-29 10:30:00
**Duration**: 4.2 seconds

---

## Test Overview

**Page**: Members (fund.members)
**Original Request**: "Create a new member"

---

## Execution Result

✅ **Test PASSED on first attempt**

No fixes required - test executed successfully.

---

## Next Steps

Run again: `npx playwright test create-member`
```

### Template 2: Pass After Auto-Fixes

```markdown
# Test Report: create-member

**Status**: ✅ PASSED (with auto-fixes)
**Generated**: 2026-01-29 10:30:00
**Duration**: 6.8 seconds (3 attempts)

---

## Execution Result

✅ **Test PASSED after 2 automatic fixes**

### Fixes Applied

1. Updated button selector from 'Save' to 'Save Member'
2. Added wait after form submission

---

## Next Steps

The test now works correctly. Run: `npx playwright test create-member`
```

### Template 3: Fail - Application Bug

```markdown
# Test Report: create-member

**Status**: ⚠️ FAILED (Application Bug)
**Generated**: 2026-01-29 10:30:00
**Duration**: 5.2 seconds

---

## Execution Result

⚠️ **Application Bug Detected**

**Message**: Member not visible after creation

**Evidence**:
- API returned 200 OK
- Member list did not refresh
- Screenshot: tests/screenshots/error-1738152600000.png

---

## Next Steps

1. Report bug to development team
2. Include screenshot and logs
3. Wait for application fix
```

### Template 4: Fail - Setup Issue

```markdown
# Test Report: create-member

**Status**: 🔧 FAILED (Setup Issue)
**Generated**: 2026-01-29 10:30:00
**Duration**: 1.0 second

---

## Execution Result

🔧 **Setup Issue**

**Error**: TOTP_SECRET not found in .env

**How to Fix**:
1. Add TOTP_SECRET to .env file
2. Run: `node helpers/verify-setup.js`
3. Re-run test

---

## Next Steps

Fix setup and try again: `npx playwright test create-member`
```

## Tools You Have Access To

- **Read**: Read plan file, test file, evaluation result
- **Write**: Write report markdown file

## Important Rules

1. **Be concise** - Reports should be scannable
2. **Actionable next steps** - Always provide clear actions
3. **Evidence for failures** - Include screenshots, logs
4. **Categorize clearly** - Make error category obvious
5. **Positive tone for passes** - Celebrate successes
6. **Helpful tone for failures** - Guide user to resolution

## Complete Example

**Inputs:**
```json
{
  "testFile": "tests/create-member.spec.js",
  "planFile": "tests/plans/create-member-plan.json",
  "evaluationResult": {
    "success": true,
    "result": "PASS",
    "duration": 4523,
    "retries": 2,
    "fixesApplied": [
      "Updated 'Save' button selector to 'Save Member'",
      "Added wait after form submission"
    ]
  }
}
```

**Generated Report** (`tests/reports/create-member-report.md`):

```markdown
# Test Report: create-member

**Status**: ✅ PASSED
**Generated**: 2026-01-29 10:35:42
**Duration**: 4.5 seconds

---

## Test Overview

**Page**: Members (fund.members)
**Requires Fund**: Yes
**Requires Member**: No
**Original Request**: "Navigate to member page and create a new member, verify that the member exists"

**Test Steps**:
1. Setup: Authenticate and create fund (automated)
2. Navigate: Go to members page (automated)
3. Create: Add new member via form
4. Verify: Check member appears in list

---

## Execution Result

✅ **Test PASSED after 2 automatic fixes**

**Duration**: 4.5 seconds
**Attempts**: 3 (2 auto-fixes applied)

### Fixes Applied

1. **Selector Update**
   - Issue: Button selector 'Save' not found
   - Fix: Updated to 'Save Member'

2. **Timing Fix**
   - Issue: Element not visible after submission
   - Fix: Added wait for network idle

---

## Test Details

**Test File**: `tests/create-member.spec.js`

**Code Summary**:
- Lines of code: 28
- Uses setupTest() for authentication
- Creates unique member with timestamp
- Verifies member appears in list

**Key Actions**:
1. Click "Add Member" button
2. Fill first name: "AutoTest"
3. Fill last name: "Member{timestamp}"
4. Click "Save Member" button
5. Verify member name is visible

---

## Next Steps

### Run Test Again

```bash
npx playwright test create-member
```

### Run with UI Mode (Interactive)

```bash
npx playwright test create-member --ui
```

### View Playwright Report

```bash
npx playwright show-report
```

---

## Artifacts

- **Plan**: `tests/plans/create-member-plan.json`
- **Test**: `tests/create-member.spec.js`
- **Report**: `tests/reports/create-member-report.md`

---

*Report generated by SF360 Playwright MCP - Test Generation Agent*
```

**Output:**
```json
{
  "success": true,
  "reportFile": "tests/reports/create-member-report.md",
  "summary": "✅ Test PASSED in 4.5s (2 auto-fixes applied)"
}
```
```

---

## Implementation Notes

### Tool Registration (mcp-server/src/index.ts)

```typescript
server.tool(
  'sf360-test-report',
  'Generate comprehensive test report',
  {
    testFile: z.string().describe('Path to test file'),
    planFile: z.string().describe('Path to plan JSON'),
    evaluationResult: z.object({
      success: z.boolean(),
      result: z.enum(['PASS', 'FAIL']),
      duration: z.number(),
      retries: z.number(),
    }).passthrough().describe('Evaluation result from test-evaluate'),
  },
  async ({ testFile, planFile, evaluationResult }) => {
    const promptPath = path.join(__dirname, '../prompts/test-report-prompt.md');
    let prompt = fs.readFileSync(promptPath, 'utf8');

    prompt = prompt.replace('{{TEST_FILE}}', testFile);
    prompt = prompt.replace('{{PLAN_FILE}}', planFile);
    prompt = prompt.replace('{{EVALUATION_RESULT}}', JSON.stringify(evaluationResult, null, 2));

    return {
      content: [{ type: 'text', text: prompt }]
    };
  }
);
```

---

## Usage Example (Claude's Perspective)

```
[Previous: sf360-test-evaluate completed with PASS after 2 fixes]

Claude: Test passed! Generating final report...
[Calls sf360-test-report with all previous results]

Tool returns:
{
  "success": true,
  "reportFile": "tests/reports/create-member-report.md",
  "summary": "✅ Test PASSED in 4.5s (2 auto-fixes applied)"
}

Claude displays to user:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test Generation Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test PASSED in 4.5 seconds (2 auto-fixes applied)

📄 Test file: tests/create-member.spec.js
📊 Full report: tests/reports/create-member-report.md

Fixes applied:
1. Updated button selector to 'Save Member'
2. Added wait after form submission

Run again:
  npx playwright test create-member
```

---

## Dependencies

### MCP Tools
- Plan JSON from `sf360-test-plan`
- Test file from `sf360-test-generate`
- Evaluation result from `sf360-test-evaluate`

### Auth System
- setupTest() API: `.project-memory/specs/test-fixture-factory/active.auth-setup-test-api.md`
- Fund/member creation: `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`
- Test data generation: `.project-memory/specs/test-fixture-factory/active.auth-data-factory.md`

---

## Testing the Tool

### Test Case 1: Pass (No Fixes)
```json
{
  "evaluationResult": { "success": true, "result": "PASS", "retries": 0 }
}
```
**Expected:** Positive report, no fixes section

### Test Case 2: Pass (With Fixes)
```json
{
  "evaluationResult": { "success": true, "result": "PASS", "retries": 2, "fixesApplied": [...] }
}
```
**Expected:** Report highlights fixes

### Test Case 3: Fail (App Bug)
```json
{
  "evaluationResult": { "success": false, "error": { "category": "app_bug", ... } }
}
```
**Expected:** Bug report with evidence, actionable steps

### Test Case 4: Fail (Setup)
```json
{
  "evaluationResult": { "success": false, "error": { "category": "setup", ... } }
}
```
**Expected:** Setup guide, recovery instructions

---

## Next Steps

This is the final tool in the workflow. After this:
- Claude displays summary to user
- User can run test with provided commands
- User can review full report in markdown file
