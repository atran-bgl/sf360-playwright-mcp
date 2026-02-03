#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load prompt from markdown file in the consuming project
function loadPrompt(filename) {
    // Prompts are in the consuming project at sf360-playwright/prompts/
    const promptPath = join(process.cwd(), 'sf360-playwright', 'prompts', filename);
    try {
        return readFileSync(promptPath, 'utf-8');
    }
    catch (error) {
        return `Error: Prompt file not found at ${promptPath}\n\nMake sure you ran 'npx sf360-mcp-init' to create the sf360-playwright/ folder structure.`;
    }
}
// Initialize MCP server
const server = new Server({
    name: 'sf360-playwright-mcp',
    version: '0.2.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Register tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'init',
                description: 'Initialize SF360 Playwright test infrastructure in this project. ' +
                    'Interactive setup wizard that: 1) Creates sf360-playwright/ folder structure, ' +
                    '2) Asks for SF360 credentials, 3) Creates .env file, 4) Installs dependencies (@playwright/test, otplib), ' +
                    '5) Installs Playwright browsers, 6) Adds official Playwright MCP for browser automation, ' +
                    '7) Verifies setup. Run this FIRST when setting up a new project.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'generate-test',
                description: 'Generate a complete Playwright test from natural language specification. ' +
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
                description: 'Explore a SF360 page and document all testable elements. ' +
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
                description: 'Update the auth.js login helper with improvements while maintaining backward compatibility. ' +
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
                description: 'Add a new SF360 page entry to menu-mapping.json. ' +
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
            {
                name: 'verify-setup',
                description: 'Verify SF360 test environment setup. ' +
                    'Checks dependencies (@playwright/test, otplib), .env configuration, Playwright browsers, and project structure. ' +
                    'Automatically installs missing dependencies if found. ' +
                    'Use this to troubleshoot issues or verify an existing setup. For first-time setup, use the "init" tool instead.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
        ],
    };
});
// Handle tool calls - return prompts with variable injection
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    try {
        let prompt;
        switch (name) {
            case 'init':
                prompt = loadPrompt('init-prompt.md');
                // No variable injection needed - fully interactive
                break;
            case 'generate-test':
                prompt = loadPrompt('generate-test-prompt.md');
                prompt = prompt
                    .replace('{{SPEC}}', String(args.spec || ''))
                    .replace('{{PAGE_NAME}}', String(args.pageName || 'auto-detect'))
                    .replace('{{TEST_NAME}}', String(args.testName || 'generated-test'));
                break;
            case 'discover-page':
                prompt = loadPrompt('discover-page-prompt.md');
                prompt = prompt
                    .replace('{{PAGE_KEY}}', String(args.pageKey || ''))
                    .replace('{{OUTPUT_FILE}}', String(args.outputFile || 'auto-generated'));
                break;
            case 'update-login-helper':
                prompt = loadPrompt('update-login-helper-prompt.md');
                prompt = prompt.replace('{{IMPROVEMENTS}}', String(args.improvements || ''));
                break;
            case 'add-page-mapping':
                prompt = loadPrompt('add-page-mapping-prompt.md');
                prompt = prompt
                    .replace('{{PAGE_NAME}}', String(args.pageName || ''))
                    .replace('{{URL}}', String(args.url || ''))
                    .replace('{{SECTION}}', String(args.section || ''))
                    .replace('{{PAGE_KEY}}', String(args.pageKey || 'auto-generate'));
                break;
            case 'verify-setup':
                prompt = loadPrompt('verify-setup-prompt.md');
                // No variable injection needed - runs checks directly
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
    }
    catch (error) {
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
    console.error('SF360 Playwright MCP Server running on stdio');
    console.error('Ready to receive tool calls from Claude');
}
main().catch((error) => {
    console.error('Fatal error in MCP server:', error);
    process.exit(1);
});
