# Tool Spec: `sf360-test-evaluate`

## Purpose

Provide Claude with instructions to debug and fix the generated test using Playwright tools and iterative problem-solving.

---

## MCP Tool Definition

### Tool Name
`sf360-test-evaluate`

### Description
```
Evaluate and debug generated test file. Returns instructions for Claude
to run the test, identify issues, and fix iteratively using Playwright tools.
```

### Input Schema

```typescript
{
  testFile: string;  // REQUIRED: Path to test file from test-generate
}
```

### Output Schema

```typescript
{
  success: boolean;
  result: 'PASS' | 'FAIL';
  testFile: string;        // Path to test file (from input)
  planFile: string;        // Path to plan file (from test header)
  attempts: number;
  fixesApplied: string[];  // List of fixes made
  duration: number;        // Total time in ms
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

---

## Prompt Content

**File:** `templates/prompts/test-evaluate-prompt.md`

```markdown
# Test Evaluation & Debugging

You have a generated Playwright test: **{{TEST_FILE}}**

Your job: Run it, debug it, fix it until it passes.

---

## Workflow

### 1. Extract Plan File Reference

Read the test file header to get the plan file path:

```bash
# Test file has header comments:
# Test: members-create
# Plan: tests/plans/members-create-plan.json
# Generated: 2026-01-29
```

Extract `planFile` for use in final report.

### 2. Run the Test

```bash
npx playwright test {{TEST_FILE}} --reporter=line
```

Capture the output and any error messages.

### 3. Analyze Result

**If test passes ✅:**
- Count how many attempts/fixes it took
- Extract planFile from test header
- Return success result

**If test fails ❌:**
- Read the error message carefully
- Determine the issue category:
  - **Test code issue**: Selector wrong, syntax error, timing issue, missing step
  - **Application bug**: Test is correct but app doesn't work as expected
  - **Setup issue**: Auth failed, env vars missing, dependencies not installed

### 4. Debug Strategy by Issue Type

#### Test Code Issues (Fix & Retry)

Common issues and how to debug:

**A. Selector Not Found**
```javascript
// Error: locator.click: Target closed
// Error: Selector "button:has-text('Save')" not found

Debug:
1. Use setupTest() to authenticate
2. Use browser_navigate to go to the failing page
3. Use browser_snapshot to see actual elements
4. Compare expected selector vs actual
5. Fix selector in test file
6. Run test again
```

**B. Syntax Errors**
```javascript
// Error: Unexpected token
// Error: await is only valid in async function

Debug:
1. Read test file
2. Check line number from error
3. Fix syntax (missing await, wrong quotes, etc.)
4. Run test again
```

**C. Timing Issues**
```javascript
// Error: Element not visible
// Error: Timeout exceeded

Debug:
1. Identify what's loading (network, animation, etc.)
2. Add appropriate wait:
   - After navigation: await page.waitForLoadState('networkidle')
   - For element: await element.waitFor({ state: 'visible' })
   - For API: await page.waitForResponse(url)
3. Run test again
```

**D. Missing Steps**
```javascript
// Error: Cannot read property of undefined
// Error: Element is disabled

Debug:
1. Use browser_navigate to manually go through the flow
2. Identify missing actions (click to open form, select dropdown, etc.)
3. Add missing steps to test
4. Run test again
```

#### Application Bugs (Report, Don't Fix)

If the test code is correct but app doesn't work:

```
Example:
- Clicked Save → API returns 200
- But member doesn't appear in list

This is an app bug, not a test issue.

Actions:
1. Gather evidence:
   - Take screenshot: browser_take_screenshot
   - Check console logs: browser_console_messages
   - Check network: browser_network_requests
2. Document the bug clearly
3. Return FAIL with category: 'app_bug'
4. Include evidence in result
5. DO NOT try to fix or work around - report to user
```

#### Setup Issues (Guide User)

If environment is not configured:

```
Examples:
- TOTP_SECRET not found in .env
- Authentication failed
- Playwright not installed

Actions:
1. Identify what's wrong
2. Provide clear fix instructions
3. Return FAIL with category: 'setup'
4. DO NOT retry - user must fix first
```

### 5. Fix & Iterate

For test code issues:

1. **Apply fix** using Edit or Write tool
2. **Document fix** in a running list (by error type)
3. **Run test again**
4. **Repeat** until test passes OR stopping condition met

**Track fixes by error type:**
- Selector errors: count separately
- Timing errors: count separately
- Syntax errors: count separately
- Auth/setup errors: stop immediately

### 6. Check-In with User

**Mandatory check-in after 10 attempts**, show progress and ask:

```
Progress Report:
- Total attempts: 10
- Fixes by type:
  - Selector: 4 fixes
  - Timing: 3 fixes
  - Syntax: 2 fixes
  - Other: 1 fix

Last 5 fixes:
  1. Updated 'Save' button selector to 'Save Member'
  2. Added wait after form submission
  3. Fixed typo in First Name field selector
  4. Added scrollIntoView for Submit button
  5. Increased timeout for success message

Current status: Still debugging selector issue on step 4

Continue? (y/n)
```

**Optional check-in (ask if helpful):**
- Every 5 fixes (if making good progress)
- When same error occurs 3 times in a row
- When unsure about next fix
- After 5 minutes of debugging

### 7. Stopping Conditions

**HARD LIMITS (Stop immediately):**

🛑 **Max 20 fix attempts total** - Ask user if you should continue beyond 20

🛑 **Max 5 fixes per error type** - If you've fixed selectors 5 times and still failing, something is fundamentally wrong. Ask user.
   - Selector errors: max 5 fixes
   - Timing errors: max 5 fixes
   - Auth/setup errors: max 5 fixes
   - Syntax errors: max 5 fixes

🛑 **Mandatory user check-in after 10 attempts** - Show progress, ask to continue

**IMMEDIATE STOPS (Don't retry):**

✅ **Test passes** - Return success with fixes list

⚠️ **Application bug detected** - Report with evidence, DO NOT continue fixing

🔧 **Setup issue** - Guide user to fix environment, DO NOT retry

**CONDITIONAL STOPS (Ask user first):**

🤔 **Same error 3+ times in a row** - Same exact error after 3 fix attempts means you're not making progress. Ask user for guidance.

⏱️ **User says stop** - Return current state at any check-in

---

## Tools Available

- **Bash**: Run playwright tests, npm commands
- **Read**: Read test files, error logs, plan files
- **Edit/Write**: Fix test code
- **Playwright MCP**:
  - `browser_navigate`: Go to pages
  - `browser_snapshot`: See page elements
  - `browser_click`: Test interactions
  - `browser_take_screenshot`: Capture evidence
  - `browser_console_messages`: Check for JS errors
  - `browser_network_requests`: Check API calls
- **setupTest()** (from helpers/auth.js): Authenticate for debugging

**See Also:**
- setupTest() API documentation: `.project-memory/specs/test-fixture-factory/active.auth-setup-test-api.md`
- Fund/member creation flow: `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`
- Test data generation: `.project-memory/specs/test-fixture-factory/active.auth-data-factory.md`

---

## Guidelines

**Be resourceful:**
- Use Playwright MCP to inspect actual pages
- Compare expected vs actual systematically
- Think through the user flow step-by-step

**Be iterative:**
- Fix one issue at a time
- Run test after each fix
- Document what you tried

**Be communicative:**
- Check-in with user regularly
- Explain what you're fixing
- Show progress clearly

**Be honest:**
- If it's an app bug, say so (don't work around it)
- If you're stuck, ask for help
- If setup is wrong, guide user to fix

**Use judgment within limits:**
- Max 20 total attempts, max 5 per error type
- Stop at hard limits and ask user
- Mandatory check-in at 10 attempts
- Stop immediately if same error 3x in a row

---

## Example Session

```
[Run test]
❌ FAIL: Selector "button:has-text('Save')" not found

[Debug]
Using browser_navigate + browser_snapshot to inspect page...
Found: Button text is actually "Save Member"

[Fix 1]
Updating test file: 'Save' → 'Save Member'

[Run test]
❌ FAIL: Element not visible after click

[Debug]
Page is loading after Save click

[Fix 2]
Adding wait: await page.waitForLoadState('networkidle')

[Run test]
✅ PASS

[Result]
{
  "success": true,
  "result": "PASS",
  "testFile": "tests/members-create.spec.js",
  "planFile": "tests/plans/members-create-plan.json",
  "attempts": 3,
  "fixesApplied": [
    "Updated button selector to 'Save Member'",
    "Added wait for network idle after form submission"
  ],
  "duration": 12500
}
```

---

## Return Format

**On success:**
```json
{
  "success": true,
  "result": "PASS",
  "testFile": "tests/members-create.spec.js",
  "planFile": "tests/plans/members-create-plan.json",
  "attempts": 3,
  "fixesApplied": ["Fix 1", "Fix 2"],
  "duration": 12500
}
```

**On app bug:**
```json
{
  "success": false,
  "result": "FAIL",
  "testFile": "tests/members-create.spec.js",
  "planFile": "tests/plans/members-create-plan.json",
  "attempts": 2,
  "error": {
    "category": "app_bug",
    "message": "Member not visible after creation (API returned 200)",
    "evidence": {
      "screenshots": ["tests/screenshots/members-create-error-1234.png"],
      "logs": ["POST /api/members → 200 OK", "Member list not refreshed"]
    }
  }
}
```

**On setup issue:**
```json
{
  "success": false,
  "result": "FAIL",
  "testFile": "tests/members-create.spec.js",
  "planFile": "tests/plans/members-create-plan.json",
  "attempts": 1,
  "error": {
    "category": "setup",
    "message": "TOTP_SECRET not found in .env",
    "recovery": "Add TOTP_SECRET=your-secret to .env file"
  }
}
```
```

---

## Implementation Notes

### Tool Registration (mcp-server/src/index.ts)

```typescript
server.tool(
  'sf360-test-evaluate',
  'Debug and fix test using Playwright tools',
  {
    testFile: z.string().describe('Path to test file'),
  },
  async ({ testFile }) => {
    const prompt = loadPrompt('test-evaluate-prompt', {
      TEST_FILE: testFile,
    });

    return {
      content: [{ type: 'text', text: prompt }]
    };
  }
);
```

---

## Key Differences from Old Approach

| Old Approach | New Approach |
|--------------|--------------|
| Complex error categorization logic | Claude uses judgment |
| Arbitrary single maxRetries limit (e.g., 3) | Smart limits: 20 total, 5 per error type |
| Predefined fix patterns | Claude debugs intuitively |
| Limited to known error types | Handles any error type |
| Rigid stopping criteria | Hard limits + mandatory check-ins |

---

## Benefits

✅ **Flexible** - Handles unexpected errors gracefully
✅ **Smart limits** - Max 20 attempts total, max 5 per error type prevents infinite loops
✅ **Mandatory check-ins** - User sees progress at 10 attempts, can stop or continue
✅ **Leverages existing tools** - Playwright MCP + Claude's reasoning
✅ **Simple to maintain** - Just a prompt, not complex logic
✅ **Smarter debugging** - Uses real page inspection
✅ **Prevents thrashing** - Same error 3x in a row = stop and ask for help

---

## Next Tool

Evaluation result → **sf360-test-report** (04-test-report-tool.md)
