#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
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
// Load prompt from package templates and inject variables
function loadPackagePrompt(promptName, variables) {
    // Prompts are in package at templates/prompts/
    const promptsDir = join(__dirname, '../../templates/prompts');
    const promptPath = join(promptsDir, `${promptName}.md`);
    try {
        let prompt = readFileSync(promptPath, 'utf-8');
        // Inject variables
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
        }
        return prompt;
    }
    catch (error) {
        return `Error: Prompt file not found at ${promptPath}\n\nThis is a package error - please report to maintainers.`;
    }
}
// Project tools (load from sf360-playwright/prompts/)
const projectTools = [
    {
        name: 'init',
        description: 'Initialize SF360 Playwright test infrastructure in this project. ' +
            'Interactive setup wizard that: 1) Creates sf360-playwright/ folder structure, ' +
            '2) Asks for SF360 credentials, 3) Creates .env file, 4) Installs dependencies (@playwright/test, otplib), ' +
            '5) Installs Playwright browsers, 6) Adds official Playwright MCP for browser automation, ' +
            '7) Verifies setup. Run this FIRST when setting up a new project.',
        inputSchema: {},
        promptFile: 'init-prompt.md',
        promptSource: 'project',
    },
    {
        name: 'discover-page',
        description: 'Explore a SF360 page and document all testable elements. ' +
            'Creates element inventory with selectors and suggests test scenarios. ' +
            'Automatically logs in before discovery.',
        inputSchema: {
            pageKey: z.string().describe('Page key from menu-mapping.json (e.g., "settings.badges", "connect.superstream_dashboard")'),
            outputFile: z.string().optional().describe('Optional: Filename to save element inventory (defaults to [page-name].json)'),
        },
        promptFile: 'discover-page-prompt.md',
        promptSource: 'project',
        variableMapper: (args) => ({
            PAGE_KEY: String(args.pageKey || ''),
            OUTPUT_FILE: String(args.outputFile || 'auto-generated'),
        }),
    },
    {
        name: 'add-page-mapping',
        description: 'Add a new SF360 page entry to menu-mapping.json. ' +
            'Use this when a new page needs to be tested but is not in the current mapping.',
        inputSchema: {
            pageName: z.string().describe('Human-readable name for the page (e.g., "Badge Settings")'),
            url: z.string().describe('Page URL path without domain and query params (e.g., "/s/badge-settings/")'),
            section: z.string().describe('Menu section: HOME, WORKFLOW, CONNECT, COMPLIANCE, REPORTS, SETTINGS, S.ADMIN, or SYSTEMDATA'),
            pageKey: z.string().optional().describe('Optional: Custom key to use in mapping (auto-generated from pageName if not provided)'),
        },
        promptFile: 'add-page-mapping-prompt.md',
        promptSource: 'project',
        variableMapper: (args) => ({
            PAGE_NAME: String(args.pageName || ''),
            URL: String(args.url || ''),
            SECTION: String(args.section || ''),
            PAGE_KEY: String(args.pageKey || 'auto-generate'),
        }),
    },
    {
        name: 'verify-setup',
        description: 'Verify SF360 test environment setup. ' +
            'Checks dependencies (@playwright/test, otplib), .env configuration, Playwright browsers, and project structure. ' +
            'Automatically installs missing dependencies if found. ' +
            'Use this to troubleshoot issues or verify an existing setup. For first-time setup, use the "init" tool instead.',
        inputSchema: {},
        promptFile: 'verify-setup-prompt.md',
        promptSource: 'project',
    },
];
// Package tools (load from templates/prompts/)
const packageTools = [
    {
        name: 'sf360-test-plan',
        description: 'Create structured test plan from user description. ' +
            'Analyzes user spec, detects target page, checks requirements (fund/member), ' +
            'extracts selectors from page discovery, and generates detailed plan JSON. ' +
            'Plan includes test steps, data requirements, and expected outcomes.',
        inputSchema: {
            spec: z.string().describe('User test description (e.g., "Create a new member and verify it appears in the list")'),
            testName: z.string().optional().describe('Optional test file name (auto-generated if not provided)'),
            pageName: z.string().optional().describe('Optional page hint (e.g., "members", "dashboard")'),
        },
        promptFile: 'test-plan-prompt.md',
        promptSource: 'package',
        variableMapper: (args) => ({
            SPEC: String(args.spec || ''),
            TEST_NAME: String(args.testName || 'auto-generated'),
            PAGE_NAME: String(args.pageName || 'not specified'),
        }),
    },
    {
        name: 'sf360-test-generate',
        description: 'Generate executable Playwright test from plan JSON. ' +
            'Reads plan file, generates test structure with setupTest(), ' +
            'creates test data variables with timestamps, converts plan steps to Playwright code, ' +
            'and writes test file to tests/ directory.',
        inputSchema: {
            planFile: z.string().describe('Path to plan JSON file from sf360-test-plan (e.g., "tests/plans/member-create-plan.json")'),
        },
        promptFile: 'test-generate-prompt.md',
        promptSource: 'package',
        variableMapper: (args) => ({
            PLAN_FILE: String(args.planFile || ''),
        }),
    },
    {
        name: 'sf360-test-evaluate',
        description: 'Execute test, debug failures, and apply automatic fixes. ' +
            'Runs test with Playwright, analyzes failures, uses MCP Playwright to inspect pages, ' +
            'fixes selectors and timing issues iteratively. Smart limits: max 20 attempts, ' +
            'max 5 per error type, mandatory check-in at 10 attempts.',
        inputSchema: {
            testFile: z.string().describe('Path to test file from sf360-test-generate (e.g., "tests/member-create.spec.js")'),
            maxRetries: z.number().optional().describe('Maximum fix attempts (default: 3)'),
            debug: z.boolean().optional().describe('Enable debug mode with screenshots (default: false)'),
        },
        promptFile: 'test-evaluate-prompt.md',
        promptSource: 'package',
        variableMapper: (args) => ({
            TEST_FILE: String(args.testFile || ''),
        }),
    },
    {
        name: 'sf360-test-report',
        description: 'Generate comprehensive test execution report. ' +
            'Creates markdown report with test metadata, execution result (PASS/FAIL), ' +
            'fixes applied, evidence (screenshots/logs for failures), and actionable next steps. ' +
            'Reports saved to tests/reports/ directory.',
        inputSchema: {
            testFile: z.string().describe('Path to test file (e.g., "tests/member-create.spec.js")'),
            planFile: z.string().describe('Path to plan JSON file (e.g., "tests/plans/member-create-plan.json")'),
            evaluationResult: z.any().describe('Result object from sf360-test-evaluate'),
        },
        promptFile: 'test-report-prompt.md',
        promptSource: 'package',
        variableMapper: (args) => ({
            TEST_FILE: String(args.testFile || ''),
            PLAN_FILE: String(args.planFile || ''),
            EVALUATION_RESULT: JSON.stringify(args.evaluationResult || {}, null, 2),
        }),
    },
];
// Initialize MCP server
const mcpServer = new McpServer({
    name: 'sf360-playwright-mcp',
    version: '0.2.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Register tools function
function registerTools(tools) {
    tools.forEach((tool) => {
        mcpServer.registerTool(tool.name, {
            description: tool.description,
            inputSchema: tool.inputSchema,
        }, async (args) => {
            try {
                // Load prompt based on source
                let prompt = tool.promptSource === 'project'
                    ? loadPrompt(tool.promptFile)
                    : loadPackagePrompt(tool.promptFile.replace('.md', ''), {});
                // Inject variables if mapper provided
                if (tool.variableMapper) {
                    const variables = tool.variableMapper(args);
                    for (const [key, value] of Object.entries(variables)) {
                        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
                    }
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
    });
}
// Register all tools
registerTools(projectTools);
registerTools(packageTools);
// Start MCP server
async function main() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    // Log to stderr (stdout reserved for MCP protocol)
    console.error('SF360 Playwright MCP Server running on stdio');
    console.error('Ready to receive tool calls from Claude');
}
main().catch((error) => {
    console.error('Fatal error in MCP server:', error);
    process.exit(1);
});
