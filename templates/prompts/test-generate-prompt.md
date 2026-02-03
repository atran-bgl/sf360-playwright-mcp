# SF360 Test Code Generator

Generate executable Playwright test from plan JSON.

---

## Hard Constraints

1. **Read plan first** - Validate structure before generating
2. **Use plan selectors** - Don't invent new ones
3. **Test data isolation** - Use variables with timestamps, never hardcode
4. **File cross-references** - Include plan path in test header

---

## Input

- `planFile`: {{PLAN_FILE}}

---

## Required Flow

### 1. Read & Validate Plan

Read `{{PLAN_FILE}}` and verify required fields:
- `metadata.testName`
- `targetPage.pageKey`
- `requirements.setupOptions`
- `testSteps`
- `testData`

If missing → return error.

---

### 2. Generate Test Structure

**Header (required):**
```javascript
// Test: {testName}
// Plan: {planFile}
// Generated: {ISO-8601 date}
//
// Description: {brief description}

const { test, expect } = require('@playwright/test');
const { setupTest } = require('./helpers/auth');

test.describe('{Suite Name}', () => {
  test('{should ...}', async ({ page }) => {
    // Test code
  });
});
```

**Naming:**
- Suite: Derived from section (e.g., "Member Management")
- Test: Start with "should" + action + outcome

---

### 3. Generate setupTest() Call

```javascript
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      pageKey: '{targetPage.pageKey}'
    });

    console.log(`Testing with fund: ${ctx.fundName} (${ctx.fundId})`);
```

**If requiresMember: true, also log:**
```javascript
    console.log(`Testing with member: ${ctx.memberName} (${ctx.memberId})`);
```

---

### 4. Generate Test Data

Use timestamps for uniqueness:

```javascript
    const testData = {
      firstName: 'AutoTest',
      lastName: `Member${Date.now()}`,
      email: `test${Date.now()}@example.com`
    };
```

---

### 5. Generate Actions & Assertions

**Filter setup steps** (handled by setupTest):
```javascript
const codeSteps = testSteps.filter(s => s.type !== 'setup');
```

**For each step, generate:**

**Clicks:**
```javascript
    await page.getByRole('button', { name: 'Add Member' }).click();
```

**Fills:**
```javascript
    await page.getByLabel('First Name').fill(testData.firstName);
```

**Waits (after navigation/submission):**
```javascript
    await page.waitForLoadState('networkidle');
```

**Assertions:**
```javascript
    await expect(page.getByText(`${testData.firstName} ${testData.lastName}`)).toBeVisible();
```

---

### 6. Selector Priority

1. `getByRole()` - buttons, inputs, links
2. `getByLabel()` - form fields
3. `getByText()` - text content
4. `locator()` - last resort

---

### 7. Format & Write

**Indentation:** 2 spaces

**Structure:**
```javascript
test('...', async ({ page }) => {
  // Setup
  const ctx = await setupTest(...);

  // Test data
  const testData = {...};

  // Actions
  await page...

  // Assertions
  await expect(...).toBeVisible();
});
```

**Write to:** `tests/{testName}.spec.js`

---

## Output (Strict)

**Success:**
```json
{
  "success": true,
  "testFile": "tests/{testName}.spec.js",
  "planFile": "{planFile}",
  "linesOfCode": 35,
  "testDescription": "should create new member and verify existence"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND | INVALID_PLAN",
    "message": "...",
    "recovery": "..."
  }
}
```

---

## Code Quality Rules

- Always use `await`
- Use testData variables, never hardcode values
- Add waits after form submissions
- Comments describe what, not how
- If test file exists, append timestamp to filename
