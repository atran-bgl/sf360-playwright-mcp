# Tool Definitions - SF360 Test Generator MCP

## Overview

The MCP server provides 4 tools that return structured prompts for Claude to execute. Each tool has a specific purpose and input schema.

## Tool Naming Convention

Tools use the prefix `mcp__sf360-test-gen__` when invoked by Claude:
- `mcp__sf360-test-gen__generate-test`
- `mcp__sf360-test-gen__discover-page`
- `mcp__sf360-test-gen__update-login-helper`
- `mcp__sf360-test-gen__add-page-mapping`

## Tool 1: generate-test

### Purpose
Generate a complete Playwright test from a natural language specification.

### When to Use
- User wants to create a new test
- User describes test behavior in natural language
- User provides test steps and expected outcomes

### Input Schema
```typescript
{
  type: 'object',
  properties: {
    spec: {
      type: 'string',
      description: 'Natural language test specification describing what to test',
      required: true
    },
    pageName: {
      type: 'string',
      description: 'Optional: Target page key from menu-mapping.json (e.g., "settings.badges")',
      required: false
    },
    testName: {
      type: 'string',
      description: 'Name for the generated test file (without extension)',
      required: true
    }
  }
}
```

### Example Invocations

#### Example 1: Simple Test
```javascript
{
  spec: "Test that the Badge settings page loads and displays the badge list",
  testName: "badge-page-load"
}
```

#### Example 2: Complex Test with Steps
```javascript
{
  spec: `Create a test that:
    1. Navigates to Badge settings
    2. Clicks 'Create New Badge' button
    3. Fills in badge name as 'Test Badge'
    4. Fills in badge color as '#FF0000'
    5. Clicks save button
    6. Verifies the badge appears in the badge list
    7. Verifies success message is displayed`,
  pageName: "settings.badges",
  testName: "badge-create"
}
```

#### Example 3: Verification Test
```javascript
{
  spec: "Verify that the SuperStream Dashboard displays the contributions table with columns for Date, Amount, Fund, and Status",
  pageName: "connect.superstream_dashboard",
  testName: "superstream-table-columns"
}
```

### Output
Returns a comprehensive prompt that instructs Claude to:
1. Read menu-mapping.json and helpers/auth.js
2. Parse the spec into actionable test steps
3. Use Playwright MCP to login and navigate
4. Discover required elements
5. Ask user for clarification if needed
6. Generate test file with proper structure
7. Save to tests/ directory

### Generated Test Structure
```javascript
const { test, expect } = require('@playwright/test');
const { login, navigateToPage } = require('../helpers/auth');
const path = require('path');

test.describe('[Test Name]', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, {
      envPath: path.join(__dirname, '../../../superstream_dashboard/.env')
    });
  });

  test('should [test description]', async ({ page }) => {
    // Navigate to page
    await navigateToPage(page, 'page.key');

    // Test steps
    await page.getByTestId('element-id').click();
    await page.getByRole('textbox', { name: 'Field' }).fill('value');

    // Assertions
    await expect(page.getByTestId('result')).toBeVisible();
    await expect(page.getByTestId('result')).toHaveText('Expected text');
  });
});
```

---

## Tool 2: discover-page

### Purpose
Explore a page and document all testable elements with their selectors.

### When to Use
- User wants to understand what's on a page
- Before writing tests for a new page
- To document available test elements
- To suggest test scenarios

### Input Schema
```typescript
{
  type: 'object',
  properties: {
    pageKey: {
      type: 'string',
      description: 'Page key from menu-mapping.json (e.g., "settings.badges", "connect.superstream_dashboard")',
      required: true
    },
    outputFile: {
      type: 'string',
      description: 'Optional: Filename to save element inventory (defaults to [page-name].json)',
      required: false
    }
  }
}
```

### Example Invocations

#### Example 1: Discover Badge Page
```javascript
{
  pageKey: "settings.badges"
}
```

#### Example 2: Discover with Custom Output
```javascript
{
  pageKey: "connect.superstream_dashboard",
  outputFile: "superstream-elements.json"
}
```

### Output
Returns a prompt that instructs Claude to:
1. Use Playwright MCP to login
2. Navigate to specified page
3. Capture page snapshot
4. Take screenshot for reference
5. Extract all interactive elements
6. Document data-testid attributes
7. Identify element roles and labels
8. Generate element inventory JSON
9. Suggest test scenarios

### Element Inventory Format
```json
{
  "pageKey": "settings.badges",
  "pageUrl": "/s/badge-settings/?firm=sf360test&uid=518",
  "discoveredAt": "2026-01-16T10:00:00Z",
  "elements": [
    {
      "id": "element-1",
      "type": "button",
      "selectors": {
        "testid": "create-badge-btn",
        "role": "button",
        "text": "Create New Badge"
      },
      "location": "top-right toolbar",
      "visible": true,
      "enabled": true
    },
    {
      "id": "element-2",
      "type": "textbox",
      "selectors": {
        "testid": "badge-name-input",
        "role": "textbox",
        "label": "Badge Name"
      },
      "location": "create badge form",
      "visible": false,
      "enabled": true
    }
  ],
  "suggestedTests": [
    "Test creating a new badge",
    "Test editing an existing badge",
    "Test deleting a badge",
    "Test badge list displays correctly"
  ]
}
```

---

## Tool 3: update-login-helper

### Purpose
Update the auth.js login helper with improvements or new features.

### When to Use
- Need to add new authentication options
- Fix login issues
- Add timeout configuration
- Extend login functionality

### Input Schema
```typescript
{
  type: 'object',
  properties: {
    improvements: {
      type: 'string',
      description: 'Description of what to improve or add to the login helper',
      required: true
    }
  }
}
```

### Example Invocations

#### Example 1: Add Timeout
```javascript
{
  improvements: "Add support for custom timeout parameter in login function"
}
```

#### Example 2: Error Handling
```javascript
{
  improvements: "Improve error handling when TOTP code is incorrect - retry up to 3 times with new codes"
}
```

#### Example 3: New Feature
```javascript
{
  improvements: "Add a loginAndNavigate helper function that combines login and navigateToPage in one call"
}
```

### Output
Returns a prompt that instructs Claude to:
1. Read helpers/auth.js
2. Understand current implementation
3. Apply requested improvements
4. Ensure backward compatibility
5. Update JSDoc documentation
6. Test changes don't break existing tests

---

## Tool 4: add-page-mapping

### Purpose
Add a new page entry to menu-mapping.json.

### When to Use
- New page added to SF360
- Page not in current mapping
- Need to test a page not yet documented

### Input Schema
```typescript
{
  type: 'object',
  properties: {
    pageName: {
      type: 'string',
      description: 'Human-readable name for the page',
      required: true
    },
    url: {
      type: 'string',
      description: 'Page URL path (without domain and query params)',
      required: true
    },
    section: {
      type: 'string',
      description: 'Menu section (HOME, WORKFLOW, CONNECT, COMPLIANCE, REPORTS, SETTINGS, S.ADMIN, SYSTEMDATA)',
      required: true
    },
    pageKey: {
      type: 'string',
      description: 'Optional: Key to use in mapping (auto-generated from pageName if not provided)',
      required: false
    }
  }
}
```

### Example Invocations

#### Example 1: Add New Settings Page
```javascript
{
  pageName: "Email Templates",
  url: "/s/email-templates/",
  section: "SETTINGS"
}
```

#### Example 2: Add with Custom Key
```javascript
{
  pageName: "Fund Performance Dashboard",
  url: "/s/performance/dashboard/",
  section: "REPORTS",
  pageKey: "fund_performance"
}
```

### Output
Returns a prompt that instructs Claude to:
1. Read config/menu-mapping.json
2. Generate page key from name (if not provided)
3. Validate section is valid
4. Add new entry in proper format
5. Validate JSON structure
6. Save updated mapping

### Entry Format
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

## Tool Registration (Implementation)

### In index.ts
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate-test',
        description: 'Generate a complete Playwright test from natural language specification. Includes login setup, page navigation, element discovery, and assertions.',
        inputSchema: {
          type: 'object',
          properties: {
            spec: {
              type: 'string',
              description: 'Natural language test specification'
            },
            pageName: {
              type: 'string',
              description: 'Optional: Target page key from menu mapping'
            },
            testName: {
              type: 'string',
              description: 'Name for the generated test file'
            }
          },
          required: ['spec', 'testName']
        }
      },
      {
        name: 'discover-page',
        description: 'Explore a page and document all testable elements. Creates element inventory with selectors and suggests test scenarios.',
        inputSchema: {
          type: 'object',
          properties: {
            pageKey: {
              type: 'string',
              description: 'Page key from menu-mapping.json'
            },
            outputFile: {
              type: 'string',
              description: 'Optional: Filename for element inventory'
            }
          },
          required: ['pageKey']
        }
      },
      {
        name: 'update-login-helper',
        description: 'Update the auth.js login helper with improvements while maintaining backward compatibility.',
        inputSchema: {
          type: 'object',
          properties: {
            improvements: {
              type: 'string',
              description: 'Description of improvements to make'
            }
          },
          required: ['improvements']
        }
      },
      {
        name: 'add-page-mapping',
        description: 'Add a new page entry to menu-mapping.json with proper structure and validation.',
        inputSchema: {
          type: 'object',
          properties: {
            pageName: {
              type: 'string',
              description: 'Human-readable page name'
            },
            url: {
              type: 'string',
              description: 'Page URL path'
            },
            section: {
              type: 'string',
              description: 'Menu section'
            },
            pageKey: {
              type: 'string',
              description: 'Optional custom key'
            }
          },
          required: ['pageName', 'url', 'section']
        }
      }
    ]
  };
});
```

### Tool Handlers
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let prompt: string;

    switch (name) {
      case 'generate-test':
        prompt = GENERATE_TEST_PROMPT;
        // Could inject args into prompt if needed
        break;
      case 'discover-page':
        prompt = DISCOVER_PAGE_PROMPT;
        break;
      case 'update-login-helper':
        prompt = UPDATE_LOGIN_HELPER_PROMPT;
        break;
      case 'add-page-mapping':
        prompt = ADD_PAGE_MAPPING_PROMPT;
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: prompt
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});
```

## Tool Comparison Matrix

| Feature | generate-test | discover-page | update-login-helper | add-page-mapping |
|---------|--------------|---------------|---------------------|------------------|
| Uses Playwright MCP | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Writes Files | ✅ Test file | ✅ Element inventory | ✅ Updates auth.js | ✅ Updates mapping |
| Requires Page Key | Optional | ✅ Required | ❌ No | ❌ No |
| Interactive Prompts | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Login Required | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Reads Menu Mapping | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| Generates Assertions | ✅ Yes | ❌ No | ❌ No | ❌ No |

## Error Handling

### Invalid Tool Name
```json
{
  "content": [{
    "type": "text",
    "text": "Error: Unknown tool: invalid-tool-name"
  }],
  "isError": true
}
```

### Missing Required Parameters
- MCP SDK validates input schema
- Returns error if required params missing
- Claude shows error to user

### Runtime Errors
- Prompt template loading errors
- Invalid JSON in prompt
- Handled gracefully with error messages
