# SF360 Playwright MCP - Code Conventions

**Always match existing code patterns. Study 2-3 similar files before writing code.**

---

## File Naming

- **TypeScript (MCP Server):** kebab-case, `.ts` extension
  - Example: `index.ts`, `tool-handler.ts`
- **JavaScript (Templates):** kebab-case, `.js` extension
  - Example: `auth.js`, `verify-setup.js`
- **Markdown:** kebab-case, `.md` extension
  - Example: `init-prompt.md`, `generate-test-prompt.md`
- **Config:** kebab-case or dot-prefix
  - Example: `menu-mapping.json`, `.env.template`

---

## Code Style

### TypeScript (MCP Server)

**Module System:** ES modules
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
export { something };
```

**Formatting:**
- **Indentation:** 2 spaces
- **Quotes:** Single quotes `'string'`
- **Semicolons:** Required
- **Line length:** No strict limit, prefer readability

**Naming:**
- **Functions:** camelCase (`loadPrompt`, `handleToolCall`)
- **Classes:** PascalCase (`Server`, `StdioServerTransport`)
- **Constants:** UPPER_SNAKE_CASE (`TOOL_NAME`)
- **Variables:** camelCase (`promptPath`, `toolName`)

**File Extensions:**
- Always include `.js` in ES module imports
  - ✅ `import { Server } from './server/index.js'`
  - ❌ `import { Server } from './server/index'`

---

### JavaScript (Templates)

**Module System:** CommonJS
```javascript
const fs = require('fs');
module.exports = { login, navigateToPage };
```

**Formatting:**
- **Indentation:** 2 spaces
- **Quotes:** Single quotes `'string'`
- **Semicolons:** Required
- **Line length:** No strict limit, prefer readability

**Naming:**
- **Functions:** camelCase (`login`, `generateTOTP`)
- **Constants:** UPPER_SNAKE_CASE (rare, mostly use const with camelCase)
- **Variables:** camelCase (`envPath`, `totpCode`)

**JSDoc Comments:**
```javascript
/**
 * Login to SF360 UAT environment
 * @param {Object} page - Playwright page object
 * @param {Object} options - Login options
 * @param {boolean} options.verbose - Enable logging
 * @returns {Object} Login result with firm, uid, username
 */
async function login(page, options = {}) {
  // ...
}
```

---

## Project Structure Conventions

### MCP Server (`mcp-server/`)

**Purpose:** TypeScript MCP server, ES modules only

**Structure:**
```
mcp-server/
├── src/
│   └── index.ts          # Entry point, tool definitions
├── dist/                 # Built output (gitignored)
├── package.json          # MCP server dependencies
└── tsconfig.json         # TypeScript configuration
```

**Rules:**
- NO CommonJS in mcp-server (ES modules only)
- Keep `src/` flat (single file is fine for now)
- Build output goes to `dist/`

---

### Templates (`templates/`)

**Purpose:** Files copied to user projects during initialization

**Structure:**
```
templates/
├── helpers/              # Utility functions
├── prompts/              # MCP tool prompts
├── tests/                # Test templates
├── config/               # Configuration files
└── .env.template         # Environment variables template
```

**Rules:**
- Use CommonJS (user projects may not use ES modules)
- Keep helpers self-contained (minimal dependencies)
- Prompts ≤400 lines each
- Config files use JSON format

---

## Error Handling

### MCP Server

**Pattern:**
```typescript
try {
  const prompt = loadPrompt(filename);
  return {
    content: [{ type: 'text', text: prompt }],
  };
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: 'text', text: `Error: ${errorMessage}` }],
    isError: true,
  };
}
```

**Rules:**
- Always catch errors in tool handlers
- Return error messages to Claude (don't crash server)
- Use descriptive error messages

---

### Templates (auth.js)

**Pattern:**
```javascript
if (!envPath) {
  throw new Error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  .env FILE NOT FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Searched:
${possiblePaths.map(p => \`  - \${p}\`).join('\\n')}

Setup: Create .env in project root with:
  USERNAME=your.email@bglcorp.com.au
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}
```

**Rules:**
- Use formatted error boxes for critical errors
- Provide actionable fix instructions
- Include context (searched paths, expected format)

---

## Async/Await Pattern

**Prefer async/await over promises:**
```javascript
// ✅ Good
async function login(page, options) {
  await page.goto(url);
  await page.fill('#username', username);
  await page.click('#submit');
}

// ❌ Avoid
function login(page, options) {
  return page.goto(url)
    .then(() => page.fill('#username', username))
    .then(() => page.click('#submit'));
}
```

**Use Promise.all for parallel operations:**
```javascript
// ✅ Good - wait for navigation while clicking
await Promise.all([
  page.waitForNavigation({ timeout: 30000 }),
  page.click('#submit')
]);
```

---

## Testing Conventions

**Test File Naming:**
- Pattern: `[feature].test.js`
- Example: `discover-page.test.js`

**Test Structure:**
```javascript
const { test, expect } = require('@playwright/test');
const { login, navigateToPage } = require('../helpers/auth');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

---

## Documentation Conventions

### README Files

**Structure:**
1. Brief description
2. Features (bullet points)
3. Quick Start (numbered steps)
4. Usage examples
5. API reference
6. Troubleshooting
7. License

**Keep concise:**
- Use bullet points, not paragraphs
- Code examples over prose
- Link to separate docs for details

---

### Prompt Templates

**Structure:**
1. Purpose (1-2 sentences)
2. Step-by-step instructions
3. Rules/constraints
4. Examples (if needed)

**Format:**
- Use numbered steps
- Use headers (##, ###)
- Use code blocks for examples
- Keep ≤400 lines

**Variable Injection:**
- Use `{{VARIABLE_NAME}}` in templates
- Replace in MCP server before returning to Claude
- Document available variables at top of prompt

---

### JSDoc Comments

**Required for exported functions:**
```javascript
/**
 * Brief description
 * @param {Type} paramName - Description
 * @param {Object} options - Optional parameters
 * @param {boolean} [options.verbose] - Optional flag
 * @returns {Type} Description of return value
 */
```

**Optional for internal functions:**
- Add if complex logic
- Skip for self-explanatory functions

---

## Configuration Files

### package.json

**Scripts naming:**
- `build` - Build production output
- `test` - Run tests
- `watch` - Watch mode for development
- `prepublishOnly` - Pre-publish checks

**Versions:**
- Use caret `^` for dependencies (e.g., `^1.0.4`)
- Use `>=` for peer dependencies (e.g., `>=1.40.0`)
- Use `>=` for engines (e.g., `>=18.0.0`)

---

### TypeScript (tsconfig.json)

**Settings:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "dist",
    "strict": true
  }
}
```

---

## Git Conventions

**Commit Messages:**
- Format: `[type] brief description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Examples:
  - `feat: add verify-setup tool`
  - `fix: handle missing .env gracefully`
  - `docs: update README with new features`

**Branch Naming:**
- Pattern: `[type]/[feature-name]`
- Examples: `feat/add-retry-logic`, `fix/totp-generation`

---

## Security Conventions

**Environment Variables:**
- NEVER commit `.env` files
- Use `.env.template` for examples
- Load via `process.env` or manual parsing
- Validate required fields on load

**Secrets:**
- NEVER hardcode credentials, API keys, or secrets
- NEVER log secrets to console
- Use environment variables for all sensitive data

**Input Validation:**
- Validate user inputs (page keys, file paths)
- Sanitize error messages (no sensitive data)
- Check file existence before reading

---

## Forbidden Actions (From base.md)

**NEVER without approval:**
- Change dependencies (package.json)
- Change configuration (tsconfig.json, .eslintrc)
- Large refactors (rewrite entire files)
- Auto-format entire files (only format your changes)
- Remove features (delete functions/tools)
- Change public API signatures
- Breaking changes
- Introduce new patterns

**ALWAYS ask first if:**
- Need to add new dependency
- Need to modify config
- Need to refactor existing code
- Need to change exported functions
- Unsure if change is breaking

---

## When in Doubt

1. **Read similar code** - Find 2-3 examples, match their style
2. **Study existing patterns** - Don't introduce new patterns
3. **Ask user** - Use AskUserQuestion if unsure
4. **Prefer minimal changes** - Only change what's required
5. **Follow conventions.md** - This file is the source of truth
