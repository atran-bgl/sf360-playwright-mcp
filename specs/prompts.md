# Phase 4: Prompt Templates Creation

## Objective
Create 4 user-editable markdown prompts that instruct Claude how to generate tests with automatic login.

---

## Prompts Directory

All prompts go in: `.playwright-test-mcp/prompts/`

**Key Feature**: Users can edit these .md files to customize behavior without recompiling MCP server.

---

## 1. generate-test-prompt.md

**Purpose**: Generate complete Playwright test from natural language spec

**Template Variables**:
- `{{SPEC}}` - Test specification
- `{{PAGE_NAME}}` - Target page key
- `{{TEST_NAME}}` - Output filename

**Key Instructions**:
1. Read `.playwright-test-mcp/config/menu-mapping.json`
2. Read `.playwright-test-mcp/log-in-helper/auth.js`
3. Parse spec into test steps
4. Use Playwright MCP to explore page if needed
5. Generate test with login in `beforeEach`
6. Include clear, descriptive test name
7. Add assertions for expected outcomes
8. Save to `tests/{{TEST_NAME}}.test.js`

**Generated Test Pattern**:
```javascript
const { test, expect } = require('@playwright/test');
const { login, navigateToPage } = require('../.playwright-test-mcp/log-in-helper/auth');

test.describe('Descriptive Suite Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);  // LOGIN ALWAYS FIRST
  });

  test('should do something specific', async ({ page }) => {
    await navigateToPage(page, 'page.key');
    // Test steps...
    await expect(page.getByTestId('element')).toBeVisible();
  });
});
```

---

## 2. discover-page-prompt.md

**Purpose**: Explore page and document testable elements

**Template Variables**:
- `{{PAGE_KEY}}` - Page to discover (e.g., "settings.badges")
- `{{OUTPUT_FILE}}` - Where to save inventory

**Key Instructions**:
1. Read menu-mapping.json to get page URL
2. Use login helper to authenticate
3. Navigate to target page
4. Use Playwright MCP: `browser_snapshot` to get DOM
5. Use Playwright MCP: `browser_take_screenshot` for visual
6. Extract interactive elements (buttons, inputs, links)
7. Document data-testid attributes
8. Identify roles and labels
9. Generate element inventory JSON
10. Suggest test scenarios

**Output Format**:
```json
{
  "pageKey": "settings.badges",
  "pageUrl": "/s/badge-settings/",
  "discoveredAt": "2026-01-20T...",
  "elements": [
    {
      "type": "button",
      "selectors": {
        "testid": "create-badge-btn",
        "role": "button",
        "text": "Create Badge"
      },
      "visible": true
    }
  ],
  "suggestedTests": [
    "Test creating a new badge",
    "Test badge list displays"
  ]
}
```

---

## 3. update-login-helper-prompt.md

**Purpose**: Enhance auth.js with new features

**Template Variables**:
- `{{IMPROVEMENTS}}` - Description of changes needed

**Key Instructions**:
1. Read current `.playwright-test-mcp/log-in-helper/auth.js`
2. Understand existing implementation
3. Apply requested improvements
4. Maintain backward compatibility
5. Update JSDoc comments
6. Test changes don't break existing tests
7. Update module.exports if new functions added

**Safety Checks**:
- Don't break existing `login()` signature
- Don't remove existing exported functions
- Maintain .env validation
- Keep TOTP support working

---

## 4. add-page-mapping-prompt.md

**Purpose**: Add new page to menu-mapping.json

**Template Variables**:
- `{{PAGE_NAME}}` - Display name
- `{{URL}}` - Page path
- `{{SECTION}}` - Menu section
- `{{PAGE_KEY}}` - Custom key or auto-generate

**Key Instructions**:
1. Read `.playwright-test-mcp/config/menu-mapping.json`
2. Determine section (HOME, WORKFLOW, CONNECT, etc.)
3. Generate page_key from pageName if not provided (snake_case)
4. Validate section is valid
5. Add entry in correct section
6. Maintain JSON formatting
7. Save updated mapping

**Entry Format**:
```json
{
  "section_name": {
    "page_key": {
      "name": "Page Name",
      "url": "/s/path/",
      "section": "SECTION"
    }
  }
}
```

---

## Prompt Best Practices

### Structure
- Clear numbered steps
- Specific tool calls (Read, Playwright MCP, Write)
- Expected outputs described
- Error handling guidance

### Login Integration
- **ALWAYS** include login in beforeEach
- Never hardcode credentials
- Use auth helper from .playwright-test-mcp/
- Check .env exists before generating

### Element Selection Priority
1. First: data-testid attributes
2. Second: role + accessible name
3. Third: CSS selectors (stable ones)
4. Ask user if multiple matches

### Assertions
- Generate based on spec's expected outcomes
- Use appropriate matchers (toBeVisible, toHaveText, etc.)
- Include meaningful error messages

---

## User Customization Examples

Users can edit prompts to:

### Add Custom Element Patterns
```markdown
When looking for buttons, also check for:
- Elements with class `.btn`, `.button`, `.action-btn`
- Elements with role="button"
- `<a>` tags that trigger actions
```

### Change Test Structure
```markdown
Generate tests using this pattern:
- Group related tests in describe blocks
- Use descriptive test names starting with "should"
- Include setup/teardown in before/after hooks
```

### Add Project-Specific Rules
```markdown
For this project:
- All tests must include screenshot on failure
- Use custom waitForStable() helper before assertions
- Tag tests with @smoke, @regression, etc.
```

---

## Files to Create

1. `.playwright-test-mcp/prompts/generate-test-prompt.md` (~200 lines)
2. `.playwright-test-mcp/prompts/discover-page-prompt.md` (~150 lines)
3. `.playwright-test-mcp/prompts/update-login-helper-prompt.md` (~100 lines)
4. `.playwright-test-mcp/prompts/add-page-mapping-prompt.md` (~100 lines)

---

## Verification

Test each prompt by:
1. Invoking tool via Claude
2. Checking prompt loads correctly
3. Verifying variable injection works
4. Following instructions manually to validate clarity

---

## Dependencies

**Requires**: Phase 1-3 complete (files moved, MCP server built)
**Enables**: Phase 5 (end-to-end verification)
