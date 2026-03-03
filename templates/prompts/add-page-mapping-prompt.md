# Add Page to SF360 Menu Mapping

You are tasked with adding a new SF360 page entry to the menu mapping configuration, making it available for test generation and navigation.

## Page Information
- **Page Name**: {{PAGE_NAME}}
- **URL**: {{URL}}
- **Section**: {{SECTION}}
- **Page Key**: {{PAGE_KEY}}

---

## Objective

Add the specified page to `sf360-playwright/config/menu-mapping.json` in the correct format and section.

---

## Step-by-Step Instructions

### Step 1: Read Current Menu Mapping

Read `sf360-playwright/config/menu-mapping.json` to understand the current structure:

**Structure**:
```json
{
  "section_name": {
    "page_key": {
      "name": "Display Name",
      "url": "/s/path/to/page/",
      "section": "SECTION_NAME"
    }
  }
}
```

**Available Sections**:
- `home` → HOME
- `workflow` → WORKFLOW
- `connect` → CONNECT
- `compliance` → COMPLIANCE
- `reports` → REPORTS
- `settings` → SETTINGS
- `s_admin` → S.ADMIN
- `system_data` → SYSTEMDATA

### Step 2: Validate Section

Ensure `{{SECTION}}` is one of the valid sections:
- HOME
- WORKFLOW
- CONNECT
- COMPLIANCE
- REPORTS
- SETTINGS
- S.ADMIN
- SYSTEMDATA

If the section is not valid, inform the user:
```markdown
Error: Invalid section "{{SECTION}}"

Valid sections are:
- HOME
- WORKFLOW
- CONNECT
- COMPLIANCE
- REPORTS
- SETTINGS
- S.ADMIN
- SYSTEMDATA

Please provide a valid section.
```

### Step 3: Generate Page Key

If `{{PAGE_KEY}}` is "auto-generate", create a page key from the page name:

**Conversion Rules**:
1. Convert to lowercase
2. Replace spaces with underscores
3. Remove special characters (except underscores and hyphens)
4. Replace multiple underscores with single underscore

**Examples**:
- "Badge Settings" → `badge_settings`
- "User List" → `user_list`
- "Corporate Action System" → `corporate_action_system`
- "TBAR Management" → `tbar_management`

**Check for Duplicates**:
If the generated key already exists in that section, append a number:
- `badge_settings_2`, `badge_settings_3`, etc.

### Step 4: Map Section Name to JSON Key

Convert the section name to the JSON key:

| Section (Input) | JSON Key (Output) |
|----------------|-------------------|
| HOME | home |
| WORKFLOW | workflow |
| CONNECT | connect |
| COMPLIANCE | compliance |
| REPORTS | reports |
| SETTINGS | settings |
| S.ADMIN | s_admin |
| SYSTEMDATA | system_data |

### Step 5: Validate URL Format

Check that `{{URL}}` follows the correct format:

**Valid Formats**:
- Internal SF360 pages: `/s/path/` (starts with `/s/`)
- External pages: `https://domain.com/path` (full URL)

**URL Validation**:
```javascript
const url = "{{URL}}";
const isInternal = url.startsWith('/s/');
const isExternal = url.startsWith('http://') || url.startsWith('https://');

if (!isInternal && !isExternal) {
  throw new Error(`Invalid URL format: ${url}\n` +
    'URL must either:\n' +
    '- Start with /s/ for internal pages\n' +
    '- Start with http:// or https:// for external pages');
}
```

### Step 6: Create Page Entry

Build the page entry object:

**For Internal Pages**:
```json
{
  "name": "{{PAGE_NAME}}",
  "url": "{{URL}}",
  "section": "{{SECTION}}"
}
```

**For External Pages**:
```json
{
  "name": "{{PAGE_NAME}}",
  "url": "{{URL}}",
  "section": "{{SECTION}}",
  "external": true
}
```

### Step 7: Add Entry to Mapping

Insert the new entry into the correct section:

**Example**:
```json
{
  "settings": {
    "badges": {
      "name": "Badges",
      "url": "/s/badge-settings/",
      "section": "SETTINGS"
    },
    "new_page_key": {
      "name": "{{PAGE_NAME}}",
      "url": "{{URL}}",
      "section": "{{SECTION}}"
    }
  }
}
```

**Alphabetical Ordering** (Optional but Recommended):
- Sort page keys alphabetically within each section
- This makes the file easier to navigate

### Step 8: Maintain JSON Formatting

Ensure the updated JSON is properly formatted:

- Use 2-space indentation
- No trailing commas
- Consistent property ordering
- Valid JSON syntax

**Validate JSON**:
```javascript
try {
  JSON.parse(updatedMapping);
  console.log('✓ Valid JSON');
} catch (error) {
  console.error('✗ Invalid JSON:', error.message);
}
```

### Step 9: Save Updated Mapping

Write the updated mapping back to `sf360-playwright/config/menu-mapping.json`

Use the Edit tool to make the changes, preserving existing entries.

### Step 10: Confirm Addition

After saving, confirm the page was added:

```markdown
✓ Page added to menu mapping

**Page**: {{PAGE_NAME}}
**Section**: {{SECTION}}
**Page Key**: [generated-key]
**URL**: {{URL}}

**Usage in Tests**:
```javascript
const { navigateToPage } = require('../helpers/auth');

test('should navigate to {{PAGE_NAME}}', async ({ page }) => {
  await login(page);
  await navigateToPage(page, '{{SECTION_KEY}}.{{PAGE_KEY}}');
  // Test page...
});
```

**Generate Tests**:
Use the test generation workflow for this page:
```
1. sf360-test-plan: Create test plan with pageName: "{{SECTION_KEY}}.{{PAGE_KEY}}"
2. sf360-test-generate: Generate test from plan
3. sf360-test-evaluate: Run and debug test
4. sf360-test-report: Get execution report
```
```

---

## Handling Special Cases

### External URLs

If the URL is external (starts with `http://` or `https://`):

```json
{
  "page_key": {
    "name": "{{PAGE_NAME}}",
    "url": "{{URL}}",
    "section": "{{SECTION}}",
    "external": true
  }
}
```

**Note**: External pages open in the same window but don't use query parameters (firm, uid).

### Quick Access Pages

If the page should be in a quick access menu:

```json
{
  "page_key": {
    "name": "{{PAGE_NAME}}",
    "url": "{{URL}}",
    "section": "{{SECTION}}",
    "quick_access": true
  }
}
```

### Pages with Badges

If the page has a badge indicator (e.g., "NEW", "BETA"):

```json
{
  "page_key": {
    "name": "{{PAGE_NAME}}",
    "url": "{{URL}}",
    "section": "{{SECTION}}",
    "badge": "new"
  }
}
```

### Creating New Sections

If adding a completely new section (rare):

1. Add the section object to the mapping
2. Document the new section name
3. Update section validation list

```json
{
  "new_section": {
    "first_page": {
      "name": "First Page",
      "url": "/s/first-page/",
      "section": "NEWSECTION"
    }
  }
}
```

---

## Validation Checklist

Before saving, verify:

### ✓ Data Validation
- [ ] Page name is non-empty
- [ ] URL follows correct format
- [ ] Section is valid
- [ ] Page key is unique within section
- [ ] Page key follows naming convention

### ✓ JSON Structure
- [ ] Valid JSON syntax
- [ ] Proper indentation (2 spaces)
- [ ] No trailing commas
- [ ] Consistent property order (name, url, section, optional)

### ✓ Integration
- [ ] Entry added to correct section
- [ ] No duplicate page keys
- [ ] External flag added if applicable
- [ ] Optional properties added if needed

---

## Example Scenarios

### Scenario 1: Add Internal Page

**Input**:
- Page Name: "Lodgement History"
- URL: "/s/lodgement-history/"
- Section: "CONNECT"
- Page Key: "auto-generate"

**Result**:
```json
{
  "connect": {
    "lodgement_history": {
      "name": "Lodgement History",
      "url": "/s/lodgement-history/",
      "section": "CONNECT"
    }
  }
}
```

**Usage**: `navigateToPage(page, 'connect.lodgement_history')`

### Scenario 2: Add External Page

**Input**:
- Page Name: "Admin Portal"
- URL: "https://admin.sf360.com.au/dashboard"
- Section: "SETTINGS"
- Page Key: "admin_portal"

**Result**:
```json
{
  "settings": {
    "admin_portal": {
      "name": "Admin Portal",
      "url": "https://admin.sf360.com.au/dashboard",
      "section": "SETTINGS",
      "external": true
    }
  }
}
```

**Usage**: `navigateToPage(page, 'settings.admin_portal')`

### Scenario 3: Add Page with Quick Access

**Input**:
- Page Name: "Recent Workflows"
- URL: "/s/workflow/recent/"
- Section: "WORKFLOW"
- Page Key: "recent_workflows"
- Quick Access: true

**Result**:
```json
{
  "workflow": {
    "recent_workflows": {
      "name": "Recent Workflows",
      "url": "/s/workflow/recent/",
      "section": "WORKFLOW",
      "quick_access": true
    }
  }
}
```

---

## Error Handling

### Page Key Already Exists

If the page key already exists:

```markdown
Warning: Page key "{{PAGE_KEY}}" already exists in section "{{SECTION}}".

Existing entry:
```json
{
  "name": "Existing Page Name",
  "url": "/existing/url/"
}
```

Options:
1. Use a different page key: "{{PAGE_KEY}}_2"
2. Update the existing entry (if this is intended)
3. Choose a different section

Please clarify how to proceed.
```

### Invalid URL

If the URL format is invalid:

```markdown
Error: Invalid URL format "{{URL}}"

SF360 URLs must be:
- Internal: /s/path/to/page/ (starts with /s/)
- External: https://domain.com/path (full URL with protocol)

Examples:
- ✓ /s/badge-settings/
- ✓ https://sso.uat.bgl360.com.au/app/admin
- ✗ badge-settings (missing /s/ prefix)
- ✗ //relative-url (invalid protocol)
```

### Section Not Found

If the section key doesn't exist in the mapping:

```markdown
Info: Section "{{SECTION_KEY}}" does not exist yet.

This will create a new section. Existing sections:
- home
- workflow
- connect
- compliance
- reports
- settings
- s_admin
- system_data

Is this correct? If yes, I'll create the new section.
```

---

## After Addition

After successfully adding the page:

1. **Verify the mapping loads correctly**:
```javascript
const mapping = require('./sf360-playwright/config/menu-mapping.json');
const page = mapping.{{SECTION_KEY}}.{{PAGE_KEY}};
console.log('✓ Page mapping valid:', page);
```

2. **Test navigation**:
```javascript
await navigateToPage(page, '{{SECTION_KEY}}.{{PAGE_KEY}}');
```

3. **Generate tests**:
Use the `sf360-test-plan` tool with the new page key, then follow the 4-tool workflow.

---

## Customization Notes

This prompt can be edited to:
- Add additional page metadata fields
- Enforce specific naming conventions
- Add section-specific validation
- Include custom sorting logic
- Add bulk import capabilities

Edit this file at: `sf360-playwright/prompts/add-page-mapping-prompt.md`
