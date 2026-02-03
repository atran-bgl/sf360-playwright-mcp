# MCP Server Source Code: index.ts

**File**: `.playwright-test-mcp/mcp-server/src/index.ts`

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load prompt from markdown file
function loadPrompt(filename: string): string {
  const promptPath = join(__dirname, '../../prompts', filename);
  try {
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    return `Error: Prompt file not found at ${promptPath}\n\nPlease create the prompt file.`;
  }
}

// Initialize MCP server
const server = new Server(
  {
    name: 'sf360-test-gen-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate-test',
        description:
          'Generate a complete Playwright test from natural language specification. ' +
          'Includes automatic login setup, page navigation, element discovery, and assertions. ' +
          'Login is ALWAYS the first step in beforeEach hook.',
        inputSchema: {
          type: 'object',
          properties: {
            spec: {
              type: 'string',
              description: 'Natural language test specification describing what to test',
            },
            pageName: {
              type: 'string',
              description: 'Optional: Target page key from menu-mapping.json (e.g., "settings.badges")',
            },
            testName: {
              type: 'string',
              description: 'Name for the generated test file (without extension). Should be descriptive and unique.',
            },
          },
          required: ['spec', 'testName'],
        },
      },
      {
        name: 'discover-page',
        description:
          'Explore a SF360 page and document all testable elements. ' +
          'Creates element inventory with selectors and suggests test scenarios. ' +
          'Automatically logs in before discovery.',
        inputSchema: {
          type: 'object',
          properties: {
            pageKey: {
              type: 'string',
              description: 'Page key from menu-mapping.json (e.g., "settings.badges", "connect.superstream_dashboard")',
            },
            outputFile: {
              type: 'string',
              description: 'Optional: Filename to save element inventory (defaults to [page-name].json)',
            },
          },
          required: ['pageKey'],
        },
      },
      {
        name: 'update-login-helper',
        description:
          'Update the auth.js login helper with improvements while maintaining backward compatibility. ' +
          'Use this to add new authentication features or fix login issues.',
        inputSchema: {
          type: 'object',
          properties: {
            improvements: {
              type: 'string',
              description: 'Description of what to improve or add to the login helper',
            },
          },
          required: ['improvements'],
        },
      },
      {
        name: 'add-page-mapping',
        description:
          'Add a new SF360 page entry to menu-mapping.json. ' +
          'Use this when a new page needs to be tested but is not in the current mapping.',
        inputSchema: {
          type: 'object',
          properties: {
            pageName: {
              type: 'string',
              description: 'Human-readable name for the page (e.g., "Badge Settings")',
            },
            url: {
              type: 'string',
              description: 'Page URL path without domain and query params (e.g., "/s/badge-settings/")',
            },
            section: {
              type: 'string',
              description: 'Menu section: HOME, WORKFLOW, CONNECT, COMPLIANCE, REPORTS, SETTINGS, S.ADMIN, or SYSTEMDATA',
            },
            pageKey: {
              type: 'string',
              description: 'Optional: Custom key to use in mapping (auto-generated from pageName if not provided)',
            },
          },
          required: ['pageName', 'url', 'section'],
        },
      },
    ],
  };
});

// Handle tool calls - return prompts with variable injection
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let prompt: string;

    switch (name) {
      case 'generate-test':
        prompt = loadPrompt('generate-test-prompt.md');
        prompt = prompt
          .replace('{{SPEC}}', args.spec || '')
          .replace('{{PAGE_NAME}}', args.pageName || 'auto-detect')
          .replace('{{TEST_NAME}}', args.testName || 'generated-test');
        break;

      case 'discover-page':
        prompt = loadPrompt('discover-page-prompt.md');
        prompt = prompt
          .replace('{{PAGE_KEY}}', args.pageKey || '')
          .replace('{{OUTPUT_FILE}}', args.outputFile || 'auto-generated');
        break;

      case 'update-login-helper':
        prompt = loadPrompt('update-login-helper-prompt.md');
        prompt = prompt.replace('{{IMPROVEMENTS}}', args.improvements || '');
        break;

      case 'add-page-mapping':
        prompt = loadPrompt('add-page-mapping-prompt.md');
        prompt = prompt
          .replace('{{PAGE_NAME}}', args.pageName || '')
          .replace('{{URL}}', args.url || '')
          .replace('{{SECTION}}', args.section || '')
          .replace('{{PAGE_KEY}}', args.pageKey || 'auto-generate');
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: prompt,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout reserved for MCP protocol)
  console.error('SF360 Test Gen MCP Server running on stdio');
  console.error('Ready to receive tool calls from Claude');
}

main().catch((error) => {
  console.error('Fatal error in MCP server:', error);
  process.exit(1);
});
```

---

## Code Explanation

### Imports
- `Server`, `StdioServerTransport`: MCP SDK core
- `CallToolRequestSchema`, `ListToolsRequestSchema`: Request types
- `fs`, `path`: File operations for loading prompts
- `fileURLToPath`: ES module helpers

### loadPrompt()
- Reads .md files from `../prompts/` directory
- Returns prompt content or error message
- Allows users to edit prompts without recompiling

### Server Initialization
- Name: `sf360-test-gen-mcp`
- Version: `0.1.0`
- Capabilities: tools only (no prompts or resources)

### ListTools Handler
- Returns array of 4 tool definitions
- Each tool has: name, description, inputSchema
- Schemas define required/optional parameters

### CallTool Handler
- Loads appropriate prompt file
- Performs variable injection ({{VAR}} → value)
- Returns prompt text to Claude
- Error handling with MCP format

### main()
- Creates stdio transport
- Connects server
- Logs to stderr (stdout for protocol)

---

## Variable Injection

Tool arguments are injected into prompts:

| Tool | Variables |
|------|-----------|
| generate-test | {{SPEC}}, {{PAGE_NAME}}, {{TEST_NAME}} |
| discover-page | {{PAGE_KEY}}, {{OUTPUT_FILE}} |
| update-login-helper | {{IMPROVEMENTS}} |
| add-page-mapping | {{PAGE_NAME}}, {{URL}}, {{SECTION}}, {{PAGE_KEY}} |

---

## Error Handling

### Prompt Not Found
Returns error message in MCP format with path to missing file

### Unknown Tool
Throws error, caught by try-catch, returned as MCP error

### Server Crash
Logs to stderr, exits with code 1

---

## Logging

All logs go to **stderr** because stdout is reserved for MCP protocol communication.

```typescript
console.error('Info message');  // ✓ Correct
console.log('Info message');     // ✗ Wrong - breaks MCP protocol
```

---

## Testing

### Manual Test
```bash
node dist/index.ts
```
Should output: "SF360 Test Gen MCP Server running on stdio"

### Integration Test
Use Claude to invoke tools and verify prompt returns
