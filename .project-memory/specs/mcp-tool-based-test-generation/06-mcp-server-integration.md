# MCP Server Integration Guide

## Purpose

This guide explains how to add the 4 new test generation tools to the MCP server in `mcp-server/src/index.ts`.

---

## File Structure

```
mcp-server/
├── src/
│   └── index.ts              ← Add tools here
├── package.json
└── tsconfig.json

templates/
└── prompts/
    ├── test-plan-prompt.md       ← Phase 1 prompt
    ├── test-generate-prompt.md   ← Phase 2 prompt
    ├── test-evaluate-prompt.md   ← Phase 3 prompt
    └── test-report-prompt.md     ← Phase 4 prompt
```

---

## Implementation Steps

### Step 1: Add Prompt Files

Create 4 new prompt files in `templates/prompts/`:

```bash
touch templates/prompts/test-plan-prompt.md
touch templates/prompts/test-generate-prompt.md
touch templates/prompts/test-evaluate-prompt.md
touch templates/prompts/test-report-prompt.md
```

Copy prompt content from:
- 01-test-plan-tool.md → test-plan-prompt.md
- 02-test-generate-tool.md → test-generate-prompt.md
- 03-test-evaluate-tool.md → test-evaluate-prompt.md
- 04-test-report-tool.md → test-report-prompt.md

### Step 2: Update mcp-server/src/index.ts

Add the 4 new tools to the MCP server.

#### Import Required Modules

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

#### Helper Function: Load Prompt

```typescript
/**
 * Load prompt from templates/prompts/ and inject variables
 */
function loadPrompt(promptName: string, variables: Record<string, string>): string {
  // Path to prompts directory (templates/prompts/)
  const promptsDir = path.join(__dirname, '../../templates/prompts');
  const promptPath = path.join(promptsDir, `${promptName}.md`);

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  let prompt = fs.readFileSync(promptPath, 'utf8');

  // Inject variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
  }

  return prompt;
}
```

#### Tool 1: `sf360-test-plan`

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'sf360-test-plan') {
    const spec = args.spec as string;
    const testName = args.testName as string | undefined;
    const pageName = args.pageName as string | undefined;

    const prompt = loadPrompt('test-plan-prompt', {
      SPEC: spec,
      TEST_NAME: testName || 'auto-generated',
      PAGE_NAME: pageName || 'not specified',
    });

    return {
      content: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    };
  }

  // ... other tools
});
```

#### Tool 2: `sf360-test-generate`

```typescript
  if (name === 'sf360-test-generate') {
    const planFile = args.planFile as string;

    const prompt = loadPrompt('test-generate-prompt', {
      PLAN_FILE: planFile,
    });

    return {
      content: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    };
  }
```

#### Tool 3: `sf360-test-evaluate`

```typescript
  if (name === 'sf360-test-evaluate') {
    const testFile = args.testFile as string;
    const maxRetries = (args.maxRetries as number) || 3;
    const debug = (args.debug as boolean) || false;

    const prompt = loadPrompt('test-evaluate-prompt', {
      TEST_FILE: testFile,
      MAX_RETRIES: maxRetries.toString(),
      DEBUG: debug.toString(),
    });

    return {
      content: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    };
  }
```

#### Tool 4: `sf360-test-report`

```typescript
  if (name === 'sf360-test-report') {
    const testFile = args.testFile as string;
    const planFile = args.planFile as string;
    const evaluationResult = args.evaluationResult as object;

    const prompt = loadPrompt('test-report-prompt', {
      TEST_FILE: testFile,
      PLAN_FILE: planFile,
      EVALUATION_RESULT: JSON.stringify(evaluationResult, null, 2),
    });

    return {
      content: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    };
  }
```

#### Register Tools in ListToolsRequestSchema

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Existing tools...
      {
        name: 'init',
        description: 'Initialize SF360 Playwright test infrastructure',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // ... other existing tools ...

      // NEW: Test generation tools
      {
        name: 'sf360-test-plan',
        description: 'Create structured test plan from user description',
        inputSchema: {
          type: 'object',
          properties: {
            spec: {
              type: 'string',
              description: 'User test description (e.g., "Create a new member and verify")',
            },
            testName: {
              type: 'string',
              description: 'Optional test file name (auto-generated if not provided)',
            },
            pageName: {
              type: 'string',
              description: 'Optional page hint (e.g., "members", "dashboard")',
            },
          },
          required: ['spec'],
        },
      },
      {
        name: 'sf360-test-generate',
        description: 'Generate executable Playwright test from plan',
        inputSchema: {
          type: 'object',
          properties: {
            planFile: {
              type: 'string',
              description: 'Path to plan JSON file from sf360-test-plan',
            },
          },
          required: ['planFile'],
        },
      },
      {
        name: 'sf360-test-evaluate',
        description: 'Execute test, debug failures, and apply automatic fixes',
        inputSchema: {
          type: 'object',
          properties: {
            testFile: {
              type: 'string',
              description: 'Path to test file from sf360-test-generate',
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum fix attempts (default: 3)',
              default: 3,
            },
            debug: {
              type: 'boolean',
              description: 'Enable debug mode with screenshots (default: false)',
              default: false,
            },
          },
          required: ['testFile'],
        },
      },
      {
        name: 'sf360-test-report',
        description: 'Generate comprehensive test report',
        inputSchema: {
          type: 'object',
          properties: {
            testFile: {
              type: 'string',
              description: 'Path to test file',
            },
            planFile: {
              type: 'string',
              description: 'Path to plan JSON',
            },
            evaluationResult: {
              type: 'object',
              description: 'Result from sf360-test-evaluate',
            },
          },
          required: ['testFile', 'planFile', 'evaluationResult'],
        },
      },
    ],
  };
});
```

---

## Complete mcp-server/src/index.ts Example

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load prompt from templates/prompts/ and inject variables
 */
function loadPrompt(promptName: string, variables: Record<string, string>): string {
  const promptsDir = path.join(__dirname, '../../templates/prompts');
  const promptPath = path.join(promptsDir, `${promptName}.md`);

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  let prompt = fs.readFileSync(promptPath, 'utf8');

  // Inject variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
  }

  return prompt;
}

// Create server instance
const server = new Server(
  {
    name: "sf360-playwright-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'init',
        description: 'Initialize SF360 Playwright test infrastructure in user project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'sf360-test-plan',
        description: 'Create structured test plan from user description',
        inputSchema: {
          type: 'object',
          properties: {
            spec: {
              type: 'string',
              description: 'User test description',
            },
            testName: {
              type: 'string',
              description: 'Optional test file name',
            },
            pageName: {
              type: 'string',
              description: 'Optional page hint',
            },
          },
          required: ['spec'],
        },
      },
      {
        name: 'sf360-test-generate',
        description: 'Generate executable Playwright test from plan',
        inputSchema: {
          type: 'object',
          properties: {
            planFile: {
              type: 'string',
              description: 'Path to plan JSON file',
            },
          },
          required: ['planFile'],
        },
      },
      {
        name: 'sf360-test-evaluate',
        description: 'Execute test and debug failures',
        inputSchema: {
          type: 'object',
          properties: {
            testFile: {
              type: 'string',
              description: 'Path to test file',
            },
            maxRetries: {
              type: 'number',
              description: 'Max fix attempts',
              default: 3,
            },
            debug: {
              type: 'boolean',
              description: 'Debug mode',
              default: false,
            },
          },
          required: ['testFile'],
        },
      },
      {
        name: 'sf360-test-report',
        description: 'Generate test report',
        inputSchema: {
          type: 'object',
          properties: {
            testFile: { type: 'string' },
            planFile: { type: 'string' },
            evaluationResult: { type: 'object' },
          },
          required: ['testFile', 'planFile', 'evaluationResult'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Existing tools
    if (name === 'init') {
      const prompt = loadPrompt('init-prompt', {});
      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    // NEW: Test Plan Tool
    if (name === 'sf360-test-plan') {
      const spec = args.spec as string;
      const testName = args.testName as string | undefined;
      const pageName = args.pageName as string | undefined;

      const prompt = loadPrompt('test-plan-prompt', {
        SPEC: spec,
        TEST_NAME: testName || 'auto-generated',
        PAGE_NAME: pageName || 'not specified',
      });

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    // NEW: Test Generate Tool
    if (name === 'sf360-test-generate') {
      const planFile = args.planFile as string;

      const prompt = loadPrompt('test-generate-prompt', {
        PLAN_FILE: planFile,
      });

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    // NEW: Test Evaluate Tool
    if (name === 'sf360-test-evaluate') {
      const testFile = args.testFile as string;
      const maxRetries = (args.maxRetries as number) || 3;
      const debug = (args.debug as boolean) || false;

      const prompt = loadPrompt('test-evaluate-prompt', {
        TEST_FILE: testFile,
        MAX_RETRIES: maxRetries.toString(),
        DEBUG: debug.toString(),
      });

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    // NEW: Test Report Tool
    if (name === 'sf360-test-report') {
      const testFile = args.testFile as string;
      const planFile = args.planFile as string;
      const evaluationResult = args.evaluationResult as object;

      const prompt = loadPrompt('test-report-prompt', {
        TEST_FILE: testFile,
        PLAN_FILE: planFile,
        EVALUATION_RESULT: JSON.stringify(evaluationResult, null, 2),
      });

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SF360 Playwright MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

---

## Testing the Integration

### Test 1: Verify Tools Are Registered

```bash
# Build the MCP server
cd mcp-server
npm run build

# Test tool listing (using MCP inspector or Claude)
# Should show: sf360-test-plan, sf360-test-generate, sf360-test-evaluate, sf360-test-report
```

### Test 2: Test Each Tool Individually

#### Test `sf360-test-plan`

```javascript
// In Claude or MCP inspector
sf360-test-plan({
  spec: "Create a new member",
  testName: "test-member"
})

// Should return: Prompt with instructions for creating test plan
```

#### Test `sf360-test-generate`

```javascript
sf360-test-generate({
  planFile: "tests/plans/test-member-plan.json"
})

// Should return: Prompt with instructions for generating test
```

#### Test `sf360-test-evaluate`

```javascript
sf360-test-evaluate({
  testFile: "tests/test-member.spec.js",
  maxRetries: 3
})

// Should return: Prompt with instructions for evaluating test
```

#### Test `sf360-test-report`

```javascript
sf360-test-report({
  testFile: "tests/test-member.spec.js",
  planFile: "tests/plans/test-member-plan.json",
  evaluationResult: { success: true, result: "PASS", duration: 4523, retries: 0 }
})

// Should return: Prompt with instructions for generating report
```

---

## Build and Deploy

### Build MCP Server

```bash
cd mcp-server
npm install
npm run build
```

**Output:** `mcp-server/dist/index.js`

### Add to Claude

```bash
cd /path/to/user-project
claude mcp add sf360-playwright-mcp -- node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"
```

### Restart Claude

Restart Claude Code to load the new tools.

---

## Troubleshooting

### Issue: Tools Not Appearing in Claude

**Cause:** MCP server not built or not registered correctly

**Fix:**
```bash
# Rebuild
cd mcp-server
npm run build

# Re-add to Claude
claude mcp remove sf360-playwright-mcp
claude mcp add sf360-playwright-mcp -- node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"

# Restart Claude
```

### Issue: Prompt File Not Found

**Cause:** Prompt files not created in templates/prompts/

**Fix:**
```bash
# Verify files exist
ls -la templates/prompts/
# Should see:
# test-plan-prompt.md
# test-generate-prompt.md
# test-evaluate-prompt.md
# test-report-prompt.md
```

### Issue: Variable Substitution Not Working

**Cause:** Incorrect placeholder format or loadPrompt() bug

**Fix:**
- Ensure placeholders are `{{VARIABLE_NAME}}` (uppercase, double braces)
- Check loadPrompt() function uses correct regex
- Test with simple prompt first

---

## Version Control

### Files to Commit

```
mcp-server/src/index.ts              ← Updated with new tools
templates/prompts/test-plan-prompt.md
templates/prompts/test-generate-prompt.md
templates/prompts/test-evaluate-prompt.md
templates/prompts/test-report-prompt.md
```

### Files to Ignore

```
mcp-server/dist/                     ← Build output (regenerate)
node_modules/                        ← Dependencies
```

---

## Backward Compatibility

### Existing Tools Remain Unchanged

The 4 new tools are additive - existing tools continue to work:
- `init`
- `generate-test` (old single-shot tool, now deprecated)
- `discover-page`
- `update-login-helper`
- `add-page-mapping`
- `verify-setup`

### Migration Strategy

**Option 1: Keep both approaches**
- Old `generate-test` for simple cases
- New 4-tool workflow for complex cases

**Option 2: Deprecate old tool**
- Mark `generate-test` as deprecated
- Guide users to new workflow
- Remove in next major version

---

## Performance Considerations

### Prompt Size

Each tool returns a prompt (typically 500-1500 lines):
- test-plan-prompt: ~1200 lines
- test-generate-prompt: ~800 lines
- test-evaluate-prompt: ~1000 lines
- test-report-prompt: ~600 lines

**Total:** ~3600 lines across 4 tools (vs ~2000 lines for single prompt)

**Trade-off:** More focused prompts, but more API calls

### Caching

Claude caches prompts automatically, so repeated calls to the same tool are fast.

---

## Future Enhancements

### 1. Parallel Test Generation

Generate multiple tests from one plan:
```javascript
sf360-test-generate-batch({
  planFile: "tests/plans/member-crud-plan.json",
  tests: ["create", "edit", "delete"]
})
```

### 2. Test Suites

Generate entire test suite:
```javascript
sf360-test-suite({
  page: "fund.members",
  operations: ["create", "read", "update", "delete"]
})
```

### 3. Visual Regression Testing

Add visual diff tool:
```javascript
sf360-test-visual({
  testFile: "tests/member-page.spec.js",
  baseline: "tests/screenshots/baseline/"
})
```

---

## Summary

1. **Add 4 prompt files** to `templates/prompts/`
2. **Update mcp-server/src/index.ts** with tool definitions
3. **Build MCP server** with `npm run build`
4. **Test tools** individually before full workflow
5. **Deploy** by adding to Claude MCP config

The tools are now ready for Claude to orchestrate the 4-phase test generation workflow!
