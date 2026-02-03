# Tool Spec: `sf360-test-plan`

## Purpose

Analyze user's test request, determine requirements, explore target page with Playwright MCP, and generate a structured test plan.

---

## MCP Tool Definition

### Tool Name
`sf360-test-plan`

### Description
```
Create a structured test plan by analyzing the user's test description,
determining page requirements (fund/member), exploring the target page,
and documenting selectors and test steps.
```

### Input Schema

```typescript
{
  spec: string;          // REQUIRED: User's test description
  testName?: string;     // OPTIONAL: Test file name (auto-generated if not provided)
  pageName?: string;     // OPTIONAL: Page hint (e.g., "members", "dashboard")
}
```

**Examples:**
```javascript
// Minimal
{ spec: "Navigate to members page and create a new member" }

// With test name
{
  spec: "Create member and verify in table",
  testName: "member-creation"
}

// With page hint
{
  spec: "Add transaction and verify balance",
  testName: "add-transaction",
  pageName: "transactions"
}
```

### Output Schema

```typescript
{
  success: boolean;
  planFile: string;           // Path to generated plan JSON
  summary: {
    testName: string;
    pageKey: string;
    pageName: string;
    requiresFund: boolean;
    requiresMember: boolean;
    testSteps: Array<{         // IMPORTANT: Actual test steps for next tool
      step: number;
      description: string;
      type: 'setup' | 'action' | 'assertion';  // setup=setupTest(), action=test code, assertion=expect()
    }>;
    exploredElements: {
      buttons: number;
      inputs: number;
      tables: number;
    };
  };
  error?: {
    code: string;             // Error code for programmatic handling
    message: string;          // Human-readable error message
    recovery?: string;        // Suggested recovery action
  };
}
```

**Success Example 1: Create Member (requiresFund: true, requiresMember: false)**
```json
{
  "success": true,
  "planFile": "tests/plans/create-member-plan.json",
  "summary": {
    "testName": "create-member",
    "pageKey": "fund.members",
    "pageName": "Members",
    "requiresFund": true,
    "requiresMember": false,
    "testSteps": [
      {
        "step": 1,
        "description": "Authenticate and create fund",
        "type": "setup"
      },
      {
        "step": 2,
        "description": "Navigate to members page",
        "type": "setup"
      },
      {
        "step": 3,
        "description": "Click Add Member, fill form (First Name, Last Name), click Save",
        "type": "action"
      },
      {
        "step": 4,
        "description": "Verify member appears in list",
        "type": "assertion"
      }
    ],
    "exploredElements": {
      "buttons": 3,
      "inputs": 3,
      "tables": 1
    }
  }
}
```

**Success Example 2: View Member Details (requiresFund: true, requiresMember: true)**
```json
{
  "success": true,
  "planFile": "tests/plans/view-member-details-plan.json",
  "summary": {
    "testName": "view-member-details",
    "pageKey": "fund.member_details",
    "pageName": "Member Details",
    "requiresFund": true,
    "requiresMember": true,
    "testSteps": [
      {
        "step": 1,
        "description": "Authenticate, create fund and member",
        "type": "setup"
      },
      {
        "step": 2,
        "description": "Navigate to member details page",
        "type": "setup"
      },
      {
        "step": 3,
        "description": "Verify member name is displayed",
        "type": "assertion"
      },
      {
        "step": 4,
        "description": "Verify member details table contains expected data",
        "type": "assertion"
      }
    ],
    "exploredElements": {
      "headings": 2,
      "tables": 1,
      "buttons": 2
    }
  }
}
```

**Error Example:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication failed: Invalid TOTP code",
    "recovery": "Check TOTP_SECRET in .env file. Run: node helpers/verify-setup.js"
  }
}
```

---

## Prompt Content

**File:** `templates/prompts/test-plan-prompt.md`

```markdown
# SF360 Test Plan Generator

You are creating a structured test plan for SF360 Playwright tests.

## Your Task

Given a user's test description, you will:
1. Parse the request to identify actions and assertions
2. Determine the target SF360 page
3. Based on the target SF360 page,  decide if  the test requires fund/member creation
4. Authenticate with auth helper
5. If fund and/or member is required, use the fund helper and member helper 
6. Explore the page with Playwright mcp
7. Repeat the test steps with Playwright mcp
8. Extract selectors for all interactive elements
9. Generate a structured test plan

## Inputs

You received:
- **spec**: {{SPEC}}
- **testName**: {{TEST_NAME}}
- **pageName**: {{PAGE_NAME}}

## Step-by-Step Instructions

### Step 1: Parse User Request

Extract:
- **Target page**: What page is the test for? (e.g., "members", "dashboard")
- **Actions**: What actions to perform? (e.g., "create", "edit", "delete", "navigate")
- **Test data**: Any specific values mentioned? (e.g., "John Doe", specific amounts)
- **Assertions**: What to verify? (e.g., "verify exists", "should display")

### Step 2: Determine Target Page Key

1. Read `config/menu-mapping.json`
2. Search for matching page by name, URL, or keywords
3. Select the best match

**If ambiguous:** Ask user to clarify which page they meant.

**Example:**
```javascript
// User said: "member page"
// Found matches:
//   - fund.members (Members list)
//   - fund.member_details (Member details)
// Select: fund.members (most likely for "create member")
```

### Step 3: Check Requirements

Read the selected page config from menu-mapping.json:

```javascript
{
  "requiresFund": true,    // Needs fund creation?
  "requiresMember": false  // Needs member creation?
}
```

Determine setupTest() options:
```javascript
{
  firm: process.env.FIRM,
  pageKey: 'fund.members'  // Auto-detects requirements
}
```

### Step 4: Authenticate for Exploration

Call setupTest() to authenticate:

```javascript
const { setupTest } = require('./helpers/auth');
const ctx = await setupTest(page, {
  firm: process.env.FIRM,
  pageKey: 'fund.members'
});
// ctx = { baseUrl, firm, uid, fundId?, fundName?, memberId?, memberName?, peopleId? }
// fundId/fundName present if requiresFund: true
// memberId/memberName/peopleId present if requiresMember: true
```

**Important:** This creates temporary fund and/or member for exploration only.

**See Also:**
- Fund/member creation implementation: `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`
- setupTest() API contract: `.project-memory/specs/test-fixture-factory/active.auth-setup-test-api.md`

### Step 5: Navigate to Target Page

```javascript
await page.goto(`${ctx.baseUrl}/s/members/?firm=${ctx.firm}&uid=${ctx.uid}&fundId=${ctx.fundId}`);
await page.waitForLoadState('networkidle');
```

### Step 6: Explore Page Elements

#### 6.1: Take Initial Snapshot
Use Playwright MCP: `browser_snapshot`

#### 6.2: Identify Visible Elements
Parse snapshot for:
- Buttons (Add, Save, Cancel, Export)
- Form fields (if visible)
- Tables/lists
- Links

#### 6.3: Trigger Form/Modal (If Needed)
If test involves creating/editing:
- Click button to open form (e.g., "Add Member")
- Use Playwright MCP: `browser_click`
- Take another snapshot

#### 6.4: Extract Form Fields
Parse form snapshot for:
- Input fields (name, label, selector)
- Dropdowns
- Checkboxes
- Required fields

#### 6.5: Map Selectors to Playwright Methods
For each element, determine best selector:
```javascript
{
  "label": "Add Member",
  "selector": "button:has-text('Add Member')",
  "method": "page.getByRole('button', { name: 'Add Member' })"
}
```

### Step 7: Generate Test Steps

Break down user's spec into discrete steps:

```javascript
[
  {
    "step": 1,
    "action": "setup",
    "description": "Authenticate and create fund",
    "type": "setup"
  },
  {
    "step": 2,
    "action": "navigate",
    "description": "Navigate to members page",
    "type": "setup"
  },
  {
    "step": 3,
    "action": "create_member",
    "description": "Create new member",
    "type": "action",
    "subSteps": [
      {
        "action": "click",
        "target": "Add Member button",
        "method": "page.getByRole('button', { name: 'Add Member' })"
      },
      {
        "action": "fill",
        "target": "First Name field",
        "method": "page.getByLabel('First Name')",
        "value": "{{testData.firstName}}"
      }
    ]
  },
  {
    "step": 4,
    "action": "verify",
    "description": "Verify member exists",
    "type": "assertion",
    "assertion": {
      "type": "visibility",
      "method": "await expect(page.getByText('...')).toBeVisible()"
    }
  }
]
```

### Step 8: Generate Test Data

Provide realistic defaults for any unspecified data:

```javascript
{
  "member": {
    "firstName": "AutoTest",
    "lastName": "Member" + Date.now(),
    "dateOfBirth": "1985-05-15"
  }
}
```

If user specified values, use those instead.

### Step 9: Create Plan Document

Combine all information into structured plan.

**Schema:**
```typescript
{
  metadata: {
    testName: string;
    originalSpec: string;
    createdAt: string;
    version: string;
  };
  targetPage: {
    pageKey: string;
    name: string;
    url: string;
    section: string;
    requiresFund: boolean;
    requiresMember: boolean;
  };
  requirements: {
    needsFund: boolean;
    needsMember: boolean;
    setupOptions: object;
  };
  testSteps: Array<TestStep>;
  testData: Record<string, any>;
  selectors: {
    buttons: Array<Selector>;
    inputs: Array<Selector>;
    tables: Array<Selector>;
    links: Array<Selector>;
  };
}
```

**Save to:** `tests/plans/{testName}-plan.json`

### Step 10: Return Result

Return success response with test steps:
```json
{
  "success": true,
  "planFile": "tests/plans/create-member-plan.json",
  "summary": {
    "testName": "create-member",
    "pageKey": "fund.members",
    "pageName": "Members",
    "requiresFund": true,
    "requiresMember": false,
    "testSteps": [
      {
        "step": 1,
        "description": "Authenticate and create fund",
        "type": "setup"
      },
      {
        "step": 2,
        "description": "Navigate to members page",
        "type": "setup"
      },
      {
        "step": 3,
        "description": "Click Add Member, fill form (First Name, Last Name), click Save",
        "type": "action"
      },
      {
        "step": 4,
        "description": "Verify member appears in list",
        "type": "assertion"
      }
    ],
    "exploredElements": {
      "buttons": 3,
      "inputs": 3,
      "tables": 1
    }
  }
}
```

## Error Handling

### Error: Cannot Determine Page

**When:** No matching page in menu-mapping.json

**Action:**
```json
{
  "success": false,
  "error": {
    "code": "PAGE_NOT_FOUND",
    "message": "Could not determine target page from: 'member page'",
    "recovery": "Available pages: fund.members, fund.member_details. Please specify exact pageKey."
  }
}
```

### Error: Authentication Failed

**When:** setupTest() fails

**Action:**
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

### Error: Page Not Found (404)

**When:** Target page URL returns 404

**Action:**
```json
{
  "success": false,
  "error": {
    "code": "PAGE_404",
    "message": "Page not found: /s/members/",
    "recovery": "Verify URL in menu-mapping.json is correct. Check if page requires different permissions."
  }
}
```

### Error: Elements Not Found

**When:** Expected elements not visible on page

**Action:**
```json
{
  "success": false,
  "error": {
    "code": "ELEMENTS_NOT_FOUND",
    "message": "Could not find 'Add Member' button on page",
    "recovery": "Found buttons: 'New Member', 'Import', 'Export'. Did you mean 'New Member'?"
  }
}
```

## Tools You Have Access To

- **Read**: Read config files (menu-mapping.json, .env)
- **Write**: Write plan JSON file
- **Playwright MCP**:
  - `browser_navigate`: Navigate to pages
  - `browser_snapshot`: Get accessibility snapshot
  - `browser_click`: Click elements to reveal forms
  - `browser_take_screenshot`: Capture screenshots for debugging

## Important Rules

1. **Always authenticate first** before exploring pages
2. **Use setupTest()** with pageKey for automatic fund/member creation
3. **Prefer accessible selectors**: getByRole > getByLabel > getByText > locator
4. **Generate realistic test data** with timestamps for uniqueness
5. **Save complete plan** - next tool (test-generate) depends on it
6. **Handle errors gracefully** - provide actionable recovery steps

## Example

**Input:**
```json
{
  "spec": "Navigate to members page and create a new member with name John Doe",
  "testName": "create-member-john-doe"
}
```

**Your Process:**
1. Parse: target="members", action="create", data={firstName:"John", lastName:"Doe"}
2. Find page: fund.members (requiresFund: true)
3. Authenticate with setupTest(page, { firm, pageKey: 'fund.members' })
4. Navigate to /s/members/
5. Take snapshot
6. Click "Add Member", take form snapshot
7. Extract fields: firstName, lastName, dateOfBirth
8. Generate test steps with extracted selectors
9. Save plan to tests/plans/create-member-john-doe-plan.json
10. Return success with summary

**Output:**
```json
{
  "success": true,
  "planFile": "tests/plans/create-member-john-doe-plan.json",
  "summary": {
    "testName": "create-member-john-doe",
    "pageKey": "fund.members",
    "pageName": "Members",
    "requiresFund": true,
    "requiresMember": false,
    "stepsCount": 4,
    "exploredElements": { "buttons": 3, "inputs": 3, "tables": 1 }
  }
}
```
```

---

## Implementation Notes

### File Locations

```
mcp-server/src/index.ts              ← Define tool here
templates/prompts/test-plan-prompt.md ← Prompt content
```

### Tool Registration (mcp-server/src/index.ts)

```typescript
server.tool(
  'sf360-test-plan',
  'Create structured test plan from user description',
  {
    spec: z.string().describe('User test description'),
    testName: z.string().optional().describe('Test file name'),
    pageName: z.string().optional().describe('Page hint'),
  },
  async ({ spec, testName, pageName }) => {
    // Load prompt
    const promptPath = path.join(__dirname, '../prompts/test-plan-prompt.md');
    let prompt = fs.readFileSync(promptPath, 'utf8');

    // Inject variables
    prompt = prompt.replace('{{SPEC}}', spec);
    prompt = prompt.replace('{{TEST_NAME}}', testName || 'auto-generated');
    prompt = prompt.replace('{{PAGE_NAME}}', pageName || 'not specified');

    return {
      content: [{ type: 'text', text: prompt }]
    };
  }
);
```

---

## Usage Example (Claude's Perspective)

```
User: "Create test to add a new member"

Claude: I'll create a test plan first.
[Calls sf360-test-plan tool with spec="Create test to add a new member"]

Tool returns:
{
  "success": true,
  "planFile": "tests/plans/add-member-plan.json",
  "summary": {
    "pageKey": "fund.members",
    "requiresFund": true,
    "stepsCount": 4
  }
}

Claude: ✅ Test plan created!
- Page: Members (fund.members)
- Requires fund: Yes
- Steps: 4
- Plan saved to: tests/plans/add-member-plan.json

Next, I'll generate the test code...
[Calls sf360-test-generate tool]
```

---

## Dependencies

### Required Files
- `config/menu-mapping.json` - Page metadata
- `helpers/auth.js` - setupTest() function
- `.env` - Authentication credentials

### Required MCP Servers
- **Playwright MCP** - For browser automation during exploration

### Required npm Packages
- `@playwright/test` - For browser context
- All setupTest() dependencies (axios, otplib, tough-cookie, etc.)

---

## Testing the Tool

### Test Case 1: Simple Member Creation
```json
{
  "spec": "Create a new member"
}
```
**Expected:** Plan generated, requiresFund=true, 4 steps

### Test Case 2: With Specific Data
```json
{
  "spec": "Create member John Doe with DOB 1990-01-01"
}
```
**Expected:** Plan uses John/Doe in test data

### Test Case 3: Ambiguous Page
```json
{
  "spec": "Update details"
}
```
**Expected:** Error asking which page (member details? fund details?)

### Test Case 4: Invalid Page
```json
{
  "spec": "Navigate to xyz page"
}
```
**Expected:** Error listing available pages

---

## Next Tool

Plan file → **sf360-test-generate** (02-test-generate-tool.md)
