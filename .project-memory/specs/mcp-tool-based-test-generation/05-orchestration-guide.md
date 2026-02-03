# Orchestration Guide for Claude

## Purpose

This guide teaches Claude (the AI assistant) how to orchestrate the 4-phase test generation workflow by calling MCP tools in the correct sequence, handling errors, and providing user feedback.

---

## Tool Sequence Overview

```
User Request
    ↓
1. sf360-test-plan       (Create plan)
    ↓
2. sf360-test-generate   (Generate test code)
    ↓
3. sf360-test-evaluate   (Run test, debug, fix)
    ↓
4. sf360-test-report     (Generate report)
    ↓
Display Summary to User
```

---

## Standard Workflow (Happy Path)

### Step 1: User Makes Request

**User says:**
> "Create a test to add a new member and verify it appears in the list"

**Claude's response:**
> I'll create a test for you. Let me start by analyzing your request and exploring the page.

### Step 2: Call `sf360-test-plan`

**Claude calls:**
```javascript
sf360-test-plan({
  spec: "Create a test to add a new member and verify it appears in the list",
  testName: "add-member",  // Inferred from spec
  pageName: "members"      // Inferred from spec
})
```

**Tool returns (success):**
```json
{
  "success": true,
  "planFile": "tests/plans/add-member-plan.json",
  "summary": {
    "pageKey": "fund.members",
    "requiresFund": true,
    "testSteps": [
      { "step": 1, "description": "Authenticate and create fund", "type": "setup" },
      { "step": 2, "description": "Navigate to members page", "type": "setup" },
      { "step": 3, "description": "Click Add Member, fill form (First Name, Last Name), click Save", "type": "action" },
      { "step": 4, "description": "Verify member appears in list", "type": "assertion" }
    ]
  }
}
```

**Claude's response:**
> ✅ Test plan created!
> - Page: Members (fund.members)
> - Requires fund: Yes
>
> **Test steps:**
> 1. 🔧 Authenticate and create fund
> 2. 🔧 Navigate to members page
> 3. 🎬 Click Add Member, fill form (First Name, Last Name), click Save
> 4. ✓ Verify member appears in list
>
> Now generating test code...

### Step 3: Call `sf360-test-generate`

**Claude calls:**
```javascript
sf360-test-generate({
  planFile: "tests/plans/add-member-plan.json"
})
```

**Tool returns (success):**
```json
{
  "success": true,
  "testFile": "tests/add-member.spec.js",
  "linesOfCode": 28
}
```

**Claude's response:**
> ✅ Test code generated!
> - File: tests/add-member.spec.js
> - 28 lines of code
>
> Running test to verify it works...

### Step 4: Call `sf360-test-evaluate`

**Claude calls:**
```javascript
sf360-test-evaluate({
  testFile: "tests/add-member.spec.js",
  maxRetries: 3
})
```

**Tool returns (success after fixes):**
```json
{
  "success": true,
  "result": "PASS",
  "duration": 4523,
  "retries": 2,
  "fixesApplied": [
    "Updated button selector to 'Save Member'",
    "Added wait after form submission"
  ]
}
```

**Claude's response:**
> ✅ Test passed after 2 automatic fixes!
> - Duration: 4.5 seconds
> - Fixes: Updated selector, added wait
>
> Generating final report...

### Step 5: Call `sf360-test-report`

**Claude calls:**
```javascript
sf360-test-report({
  testFile: "tests/add-member.spec.js",
  planFile: "tests/plans/add-member-plan.json",
  evaluationResult: {
    success: true,
    result: "PASS",
    duration: 4523,
    retries: 2,
    fixesApplied: [...]
  }
})
```

**Tool returns:**
```json
{
  "success": true,
  "reportFile": "tests/reports/add-member-report.md",
  "summary": "✅ Test PASSED in 4.5s (2 auto-fixes applied)"
}
```

### Step 6: Display Final Summary

**Claude's final response:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test Generation Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test PASSED in 4.5 seconds (2 auto-fixes applied)

📄 Test file: tests/add-member.spec.js
📋 Plan: tests/plans/add-member-plan.json
📊 Report: tests/reports/add-member-report.md

Fixes applied:
1. Updated button selector to 'Save Member'
2. Added wait after form submission

Run your test:
  npx playwright test add-member

Run with UI mode:
  npx playwright test add-member --ui
```

---

## Error Handling Patterns

### Pattern 1: Planning Fails (Cannot Determine Page)

**Tool returns:**
```json
{
  "success": false,
  "error": {
    "code": "PAGE_NOT_FOUND",
    "message": "Could not determine target page from: 'details page'",
    "recovery": "Available pages: fund.members, fund.member_details, fund.transactions..."
  }
}
```

**Claude's response:**
```
❌ Could not determine which page you meant.

Available pages in the system:
- fund.members (Members list)
- fund.member_details (Member details)
- fund.transactions (Transactions)
- firm.dashboard (Dashboard)

Please specify which page you want to test, for example:
"Create a test for the members list page"
```

**DO NOT proceed to next tool** - Wait for user clarification.

---

### Pattern 2: Planning Fails (Authentication)

**Tool returns:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication failed: Invalid TOTP code",
    "recovery": "Check TOTP_SECRET in .env. Run: node helpers/verify-setup.js"
  }
}
```

**Claude's response:**
```
❌ Authentication failed during page exploration.

Error: Invalid TOTP code

This is likely a setup issue. Please:
1. Check TOTP_SECRET in your .env file
2. Verify your system clock is synchronized
3. Run: node helpers/verify-setup.js

After fixing, try again.
```

**DO NOT proceed to next tool** - Stop workflow.

---

### Pattern 3: Test Generation Fails

**Tool returns:**
```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan file not found: tests/plans/xyz-plan.json"
  }
}
```

**Claude's response:**
```
❌ Test generation failed: Plan file not found.

This shouldn't happen. Let me try creating the plan again...
```

**Recovery action:** Retry `sf360-test-plan` tool.

---

### Pattern 4: Test Evaluation Fails (Application Bug)

**Tool returns:**
```json
{
  "success": false,
  "result": "FAIL",
  "error": {
    "category": "app_bug",
    "message": "Member 'John Doe' not visible after creation",
    "evidence": {
      "screenshots": ["tests/screenshots/error-1738152600000.png"],
      "logs": ["POST /api/members → 500 Internal Server Error"]
    }
  }
}
```

**Claude's response:**
```
⚠️ Test detected an application bug!

The test ran correctly, but the application didn't behave as expected:

**Issue**: Member 'John Doe' not visible after creation
**Evidence**:
- API call returned 500 Internal Server Error
- Screenshot: tests/screenshots/error-1738152600000.png

This appears to be a bug in the SF360 application, not the test code.

Generating detailed bug report...
```

**Action:** Proceed to `sf360-test-report` to document the bug.

---

### Pattern 5: Test Evaluation Fails (Max Retries)

**Tool returns:**
```json
{
  "success": false,
  "result": "FAIL",
  "retries": 3,
  "error": {
    "category": "test_code",
    "message": "Could not fix test after 3 attempts",
    "lastError": "Selector 'button.submit' not found"
  }
}
```

**Claude's response:**
```
❌ Test failed after 3 automatic fix attempts.

The test has an issue I couldn't automatically fix:
**Last error**: Selector 'button.submit' not found

This might need manual intervention. Possible causes:
1. Element is in an iframe
2. Element requires special interaction (hover, scroll)
3. Page structure is different than expected

Would you like me to:
a) Try with debug mode for more details
b) Generate the report as-is for your manual review
c) Try a different approach to the test
```

**Action:** Ask user for guidance before proceeding.

---

### Pattern 6: Setup Error

**Tool returns:**
```json
{
  "success": false,
  "result": "FAIL",
  "error": {
    "category": "setup",
    "message": "TOTP_SECRET not found in .env",
    "recovery": "Add TOTP_SECRET to .env file"
  }
}
```

**Claude's response:**
```
🔧 Setup issue detected!

**Error**: TOTP_SECRET not found in .env

Please create or update your .env file with:
```
USERNAME=your-username
USER_PASSWORD=your-password
TOTP_SECRET=your-totp-secret
FIRM=your-firm-code
BASE_URL=https://sf360.uat.bgl360.com.au
```

After fixing, run:
  node helpers/verify-setup.js

Then I can retry test generation.
```

**Action:** Stop workflow, wait for user to fix setup.

---

## Decision Tree: When to Continue vs Stop

```
Tool Result → Decision
────────────────────────────────────────────────────────────────

sf360-test-plan success=false
  ├─ code=PAGE_NOT_FOUND    → STOP, ask user for clarification
  ├─ code=AUTH_FAILED       → STOP, guide user to fix auth
  └─ code=PAGE_404          → STOP, report issue

sf360-test-plan success=true
  → CONTINUE to sf360-test-generate

sf360-test-generate success=false
  ├─ code=PLAN_NOT_FOUND    → RETRY sf360-test-plan (once)
  └─ code=INVALID_PLAN      → RETRY sf360-test-plan (once)

sf360-test-generate success=true
  → CONTINUE to sf360-test-evaluate

sf360-test-evaluate success=true, result=PASS
  → CONTINUE to sf360-test-report (success story)

sf360-test-evaluate success=false, error.category=app_bug
  → CONTINUE to sf360-test-report (document bug)

sf360-test-evaluate success=false, error.category=test_code
  ├─ retries < maxRetries   → Already retried internally, report failure
  └─ retries = maxRetries   → ASK USER for next action

sf360-test-evaluate success=false, error.category=setup
  → STOP, guide user to fix setup

sf360-test-report success=true
  → DONE, display summary to user
```

---

## Concise Communication

### DO: Keep responses short and actionable

```
✅ Good:
"Test plan created! Generating code..."

❌ Too verbose:
"I have successfully created a comprehensive test plan that includes all the necessary steps, selectors, and data. The plan has been saved to the file system and is now ready for the next phase where I will generate the actual Playwright test code based on this plan."
```

### DO: Use structure and emojis

```
✅ Good:
✅ Test passed!
- Duration: 4.5s
- Fixes: 2
- File: tests/add-member.spec.js

❌ Plain:
The test passed. It took 4.5 seconds. Two fixes were applied. The file is at tests/add-member.spec.js.
```

### DO: Provide next steps

```
✅ Good:
Run your test:
  npx playwright test add-member

❌ Missing:
The test is ready.
```

---

## Handling Edge Cases

### Edge Case 1: User Provides Ambiguous Request

**User says:**
> "Create a test for the page"

**Claude should:**
1. Call `sf360-test-plan` (let tool handle ambiguity)
2. If tool returns PAGE_NOT_FOUND, ask user:
   ```
   Which page would you like to test? Available pages:
   - fund.members (Members)
   - fund.transactions (Transactions)
   - firm.dashboard (Dashboard)
   ...
   ```

### Edge Case 2: User Provides Very Specific Request

**User says:**
> "Create test file named 'member-crud-test' for fund.members page that creates member John Doe born 1990-01-01 and verifies the member appears with status Active"

**Claude should:**
1. Parse details: testName="member-crud-test", pageKey="fund.members", data={firstName:"John", lastName:"Doe", dob:"1990-01-01"}, assertion="status Active"
2. Call `sf360-test-plan` with all details
3. Proceed normally

### Edge Case 3: User Asks to Skip Evaluation

**User says:**
> "Just generate the test, don't run it"

**Claude should:**
1. Call `sf360-test-plan`
2. Call `sf360-test-generate`
3. Skip `sf360-test-evaluate`
4. Skip `sf360-test-report`
5. Display:
   ```
   ✅ Test generated (not executed)
   File: tests/add-member.spec.js

   Run manually:
     npx playwright test add-member
   ```

### Edge Case 4: User Wants to Regenerate Only Test Code

**User says:**
> "Regenerate the test code for add-member, the plan is already there"

**Claude should:**
1. Skip `sf360-test-plan`
2. Call `sf360-test-generate` with existing plan file
3. Proceed normally with evaluate and report

---

## Progress Updates

### Show progress between tools

```
Claude: I'll create a test for adding a member.

[Calls sf360-test-plan]
✅ Plan created
[Calls sf360-test-generate]
✅ Code generated
[Calls sf360-test-evaluate]
✅ Test passed (4.5s, 2 fixes)
[Calls sf360-test-report]
✅ Report generated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Generation Complete!
...
```

### Don't overwhelm with details

```
❌ Too much:
"Calling sf360-test-plan with parameters: spec='...', testName='add-member', pageName='members'. This will analyze the request, explore the page, extract selectors..."

✅ Just right:
"Creating test plan..."
```

---

## User Interaction Patterns

### When to Ask Questions

**ASK when:**
- Tool returns PAGE_NOT_FOUND (ambiguous page)
- Test evaluation maxed out retries (ask how to proceed)
- User request is unclear

**DON'T ASK when:**
- Tool provides clear recovery instructions (just display them)
- Error is clearly a setup issue (guide user to fix)
- Test passed successfully (just celebrate and show next steps)

### When to Offer Choices

```
Good example:

⚠️ Test failed after 3 fix attempts.

What would you like me to do?
a) Generate report as-is for manual review
b) Try with debug mode for more details
c) Try a different testing approach
```

---

## Complete Example: Full Session

```
User: Create a test to add a new member

Claude: I'll create a test for adding a member. Let me start by exploring the members page.

[Calls sf360-test-plan]

✅ Test plan created
- Page: Members (fund.members)
- Requires fund: Yes
- Steps: 4

Generating test code...

[Calls sf360-test-generate]

✅ Test code generated
- File: tests/add-member.spec.js
- 28 lines of code

Running test to verify it works...

[Calls sf360-test-evaluate]

⚠️ Test failed on first attempt (selector issue)
✅ Applied fix: Updated button selector to 'Save Member'
✅ Test passed on second attempt (4.5s)

Generating final report...

[Calls sf360-test-report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test Generation Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test PASSED in 4.5 seconds (1 auto-fix applied)

📄 Test file: tests/add-member.spec.js
📊 Full report: tests/reports/add-member-report.md

Run your test:
  npx playwright test add-member
```

---

## Summary: Key Orchestration Rules

1. **Always call tools in sequence**: plan → generate → evaluate → report
2. **Stop on critical errors**: Setup issues, authentication failures
3. **Continue on app bugs**: Generate report to document the bug
4. **Ask user when uncertain**: Ambiguous requests, max retries reached
5. **Keep communication concise**: Short updates between tools
6. **Celebrate successes**: Positive tone for passing tests
7. **Guide on failures**: Clear next steps for user
8. **Don't retry indefinitely**: Respect maxRetries, ask user if stuck
9. **Show progress**: Let user know what's happening
10. **Provide runnable commands**: Always end with next steps
