# Test Evaluation & Debugging

Run, debug, and fix test: **{{TEST_FILE}}**

---

## Hard Constraints

1. **Max 20 total attempts** - Stop and ask user to continue beyond 20
2. **Max 5 fixes per error type** - If same error type fails 5x, stop and ask
3. **Mandatory check-in at 10 attempts** - Show progress, ask to continue
4. **Stop if same error 3x in a row** - Not making progress, ask for help

---

## Workflow

### 1. Extract Plan File

Read test header to get plan file path:
```javascript
// Plan: tests/plans/{testName}-plan.json
```

### 2. Run Test

```bash
npx playwright test {{TEST_FILE}} --reporter=line
```

### 3. Analyze Result

**If PASS ✅:**
- Extract planFile from header
- Return success result

**If FAIL ❌:**
- Determine category:
  - **Test code issue** - Fix and retry
  - **Application bug** - Report with evidence, stop
  - **Setup issue** - Guide user, stop

---

## Debug Strategies

### Test Code Issues (Fix & Retry)

**Selector not found:**
1. Use MCP Playwright to navigate to page
2. Use `browser_snapshot` to see actual elements
3. Compare expected vs actual selector
4. Fix selector in test file
5. Run test again

**Timing issues:**
1. Add wait after navigation: `await page.waitForLoadState('networkidle')`
2. Add wait for element: `await element.waitFor({ state: 'visible' })`
3. Increase timeout: `{ timeout: 10000 }`

**Missing steps:**
1. Use MCP Playwright to manually walk through flow
2. Identify missing actions (open modal, select dropdown, etc.)
3. Add missing steps
4. Run test again

### Application Bugs (Report, Don't Fix)

If test code is correct but app broken:

1. Gather evidence:
   - `browser_take_screenshot`
   - `browser_console_messages`
   - `browser_network_requests`
2. Return FAIL with category: `app_bug`
3. Include evidence
4. DO NOT retry or work around

### Setup Issues (Guide User)

If environment not configured:

1. Identify what's wrong (TOTP_SECRET missing, auth failed, etc.)
2. Provide fix instructions
3. Return FAIL with category: `setup`
4. DO NOT retry

---

## Fix Tracking

Track fixes by error type:
- Selector errors: count separately
- Timing errors: count separately
- Syntax errors: count separately
- Auth/setup errors: stop immediately

---

## Check-Ins

**Mandatory at 10 attempts:**
```
Progress Report:
- Total attempts: 10
- Fixes by type:
  - Selector: 4 fixes
  - Timing: 3 fixes
  - Syntax: 2 fixes

Last 5 fixes:
  1. Updated 'Save' button selector to 'Save Member'
  2. Added wait after form submission
  3. Fixed typo in First Name field selector
  4. Added scrollIntoView for Submit button
  5. Increased timeout for success message

Current status: Still debugging selector issue on step 4

Continue? (y/n)
```

**Optional check-ins:**
- Every 5 fixes (if making good progress)
- Same error 3x in a row
- When unsure about next fix

---

## Stopping Conditions

**Stop immediately:**
- ✅ Test passes - Return success
- ⚠️ Application bug - Report with evidence
- 🔧 Setup issue - Guide user to fix
- 🛑 20 attempts reached - Ask to continue
- 🛑 5 fixes per error type - Ask to continue
- 🛑 Same error 3x in a row - Ask for help

**User says stop:**
- Return current state

---

## Tools Available

- **Bash**: Run playwright tests
- **Read/Edit/Write**: Fix test code
- **MCP Playwright**:
  - `browser_navigate` - Go to pages
  - `browser_snapshot` - See elements
  - `browser_take_screenshot` - Capture evidence
  - `browser_console_messages` - Check JS errors
  - `browser_network_requests` - Check API calls
- **setupTest()** (from helpers/auth.js) - Authenticate for debugging

---

## Output (Strict)

**Success:**
```json
{
  "success": true,
  "result": "PASS",
  "testFile": "{{TEST_FILE}}",
  "planFile": "tests/plans/{testName}-plan.json",
  "attempts": 3,
  "fixesApplied": ["Fix 1", "Fix 2"],
  "duration": 12500
}
```

**Application bug:**
```json
{
  "success": false,
  "result": "FAIL",
  "testFile": "{{TEST_FILE}}",
  "planFile": "tests/plans/{testName}-plan.json",
  "attempts": 2,
  "error": {
    "category": "app_bug",
    "message": "Member not visible after creation (API returned 200)",
    "evidence": {
      "screenshots": ["tests/screenshots/error-*.png"],
      "logs": ["POST /api/members → 200 OK", "Member list not refreshed"]
    }
  }
}
```

**Setup issue:**
```json
{
  "success": false,
  "result": "FAIL",
  "testFile": "{{TEST_FILE}}",
  "planFile": "tests/plans/{testName}-plan.json",
  "attempts": 1,
  "error": {
    "category": "setup",
    "message": "TOTP_SECRET not found in .env",
    "recovery": "Add TOTP_SECRET=your-secret to .env file"
  }
}
```

---

## Guidelines

- Be resourceful - Use MCP Playwright to inspect actual pages
- Be iterative - Fix one issue at a time
- Be communicative - Check-in regularly with user
- Be honest - If app bug or stuck, say so
- Use judgment within limits - Respect hard limits
