# Requirements - SF360 Test Generator MCP

## User Requirements (Gathered via AskUserQuestion)

### Input Format
**Requirement**: Natural language test descriptions/specifications
**User Choice**: "Natural language descriptions"
**Rationale**: Provides flexibility, no need to learn structured format

**Examples**:
```
"Generate a test for Badge settings - verify user can create a new badge"

"Test the SuperStream Dashboard loads correctly and displays the contributions table"

"Create a test that:
- Navigates to Workflow Jobs
- Filters by 'Tasks for me'
- Verifies at least one job is displayed"
```

### Element Identification Strategy
**Requirement**: How to identify elements on the page
**User Choices** (multi-select):
1. ✅ Test IDs (data-testid) - PREFERRED
2. ✅ AI-inferred from description

**Priority Order**:
1. First: Look for `data-testid` attributes
2. Fallback: Use accessibility roles and labels
3. Last resort: AI infers best match from description

**Example**:
```javascript
// Preferred
await page.getByTestId('create-badge-button').click();

// Fallback
await page.getByRole('button', { name: 'Create Badge' }).click();

// AI-inferred (when no testid/role available)
await page.locator('button.primary-btn').filter({ hasText: 'Create' }).click();
```

### Automation Level
**Requirement**: Level of automation
**User Choice**: "Interactive guided generation"
**Rationale**: Balance between automation and control

**What This Means**:
- MCP generates complete test automatically
- Claude asks clarifying questions when:
  - Multiple elements match description
  - Ambiguous test steps
  - Assertion strategy unclear
- User provides answers via AskUserQuestion
- Claude continues generation with user's input

**Example Interaction**:
```
Claude: "I found 3 buttons that could match 'save':
1. 'Save Draft' (data-testid: save-draft-btn)
2. 'Save & Publish' (data-testid: save-publish-btn)
3. 'Save Changes' (data-testid: save-changes-btn)

Which button should the test click?"

User: "Option 2 - Save & Publish"

Claude: [Continues generating test with save-publish-btn]
```

### Assertion Generation
**Requirement**: Should MCP generate assertions?
**User Choice**: "Yes, generate assertions from expected outcomes"
**Rationale**: Complete, runnable tests without manual assertion writing

**What Gets Generated**:
```javascript
// From spec: "verify the badge appears in the list"
test('should create a new badge', async ({ page }) => {
  // ... test steps ...

  // Generated assertion
  await expect(page.getByTestId('badge-list'))
    .toContainText('Test Badge');
});

// From spec: "ensure success message is displayed"
test('should show success message', async ({ page }) => {
  // ... test steps ...

  // Generated assertion
  await expect(page.getByRole('alert'))
    .toHaveText(/successfully created/i);
});
```

### Login Setup
**Requirement**: Automatically include SF360 login in tests
**User Requirement**: "I want the login setup to be part of the MCP server, so that when Claude creates a test suite, it automatically adds the setup as the first step in the test flow"

**Implementation**:
- Every generated test includes login in `beforeEach` hook
- Uses existing `helpers/auth.js`
- Reads credentials from .env automatically
- No manual login code writing

```javascript
test.beforeEach(async ({ page }) => {
  await login(page, {
    envPath: path.join(__dirname, '../../../superstream_dashboard/.env')
  });
});
```

### Session Management
**Requirement**: Browser session handling
**User Choice**: "Maintain persistent session (Recommended)"
**Rationale**: Efficiency - login once, reuse session

**Implementation**:
- Test framework handles session persistence
- `beforeEach` login reuses authenticated state when possible
- Auth helper manages TOTP and firm selection
- Tests can run independently without re-login overhead

## Functional Requirements

### FR-1: Test Generation
**Must**: Generate complete Playwright test from natural language spec
**Includes**:
- Test file structure
- Login setup (beforeEach)
- Navigation to target page
- Test steps
- Assertions
- Proper imports

### FR-2: Element Discovery
**Must**: Discover and document all testable elements on a page
**Outputs**:
- Element inventory JSON
- Element types (button, input, link, etc.)
- Available selectors (testid, role, css)
- Accessibility information
- Suggested test scenarios

### FR-3: Interactive Guidance
**Must**: Ask user for clarification when ambiguous
**Triggers**:
- Multiple element matches
- Unclear test steps
- Missing information in spec
**Method**: AskUserQuestion tool

### FR-4: Smart Element Selection
**Must**: Prioritize data-testid, fall back to other strategies
**Algorithm**:
1. Search for data-testid matching description
2. If not found, search for role + accessible name
3. If not found, use AI inference from snapshot
4. If multiple matches, ask user

### FR-5: Login Integration
**Must**: Include login setup in all generated tests
**Requirements**:
- Use existing auth helper
- Reference .env for credentials
- Include in beforeEach hook
- Support firm selection

### FR-6: Menu Navigation
**Must**: Use menu mapping for page navigation
**Requirements**:
- Read menu-mapping.json
- Support all 37 pages
- Use navigateToPage helper
- Validate page keys

### FR-7: Assertion Generation
**Must**: Generate expect() statements from spec
**Types**:
- Element visibility: `toBeVisible()`
- Text content: `toHaveText()`, `toContainText()`
- Element state: `toBeEnabled()`, `toBeChecked()`
- URL validation: `toHaveURL()`
- Count validation: `toHaveCount()`

### FR-8: Helper Management
**Must**: Support updating auth helper
**Capabilities**:
- Read current helper code
- Apply improvements
- Maintain backward compatibility
- Update documentation

### FR-9: Mapping Management
**Must**: Support adding new pages to menu mapping
**Capabilities**:
- Read current mapping
- Add new entries
- Validate structure
- Save updated mapping

## Non-Functional Requirements

### NFR-1: Performance
- Tool invocation: < 100ms response time
- Prompt return: Complete within 500ms
- Test generation: Complete within 2 minutes
- Element discovery: Complete within 1 minute

### NFR-2: Reliability
- MCP server: 99.9% uptime (runs locally)
- Prompt consistency: Always return valid prompts
- Error handling: Graceful failures with helpful messages

### NFR-3: Usability
- Clear tool descriptions
- Helpful error messages
- Interactive prompts are clear
- Generated tests are readable

### NFR-4: Maintainability
- Prompts are versioned in code
- Easy to update and extend
- Well-documented
- TypeScript for type safety

### NFR-5: Compatibility
- Works with Claude Desktop and Claude Code CLI
- Node.js >= 18.0.0
- Compatible with existing sf360-playwright-mcp project
- No conflicts with other MCP servers

### NFR-6: Security
- Never stores credentials
- No file system access beyond prompt templates
- User approval required for all operations (via Claude)
- Safe code generation patterns

## Technical Constraints

### TC-1: MCP SDK Version
**Constraint**: Must use `@modelcontextprotocol/sdk` ^1.25.2
**Reason**: Compatibility with Claude clients

### TC-2: TypeScript/ESM
**Constraint**: Must use TypeScript with ES modules
**Reason**: Modern JavaScript, type safety, compatibility

### TC-3: Stdio Transport
**Constraint**: Must use stdio for communication
**Reason**: Standard MCP pattern, works with all clients

### TC-4: Pure Prompt Provider
**Constraint**: Never execute file operations directly
**Reason**: Security, user control, MCP best practice

### TC-5: Existing Project Structure
**Constraint**: Must work with current sf360-playwright-mcp layout
**Reason**: Don't break existing tests and helpers

## Success Criteria

### User Experience
- [ ] User can generate test with single natural language request
- [ ] Generated tests run successfully without modification
- [ ] Login setup works automatically
- [ ] Interactive prompts are clear and helpful
- [ ] Element discovery is comprehensive

### Technical
- [ ] MCP server starts without errors
- [ ] All 4 tools are discoverable
- [ ] Prompts return within performance limits
- [ ] Generated code follows project conventions
- [ ] Tests use auth helper correctly

### Quality
- [ ] Generated tests are readable
- [ ] Assertions match spec expectations
- [ ] Element selectors are stable (prefer data-testid)
- [ ] No hardcoded credentials
- [ ] Documentation is complete

## Out of Scope (Future Enhancements)

### Not in v0.1.0
- ❌ Visual regression testing
- ❌ Performance testing generation
- ❌ API test generation
- ❌ Multi-page test flows
- ❌ Test data generation
- ❌ Custom fixture generation
- ❌ Parallel test execution strategy
- ❌ Test reporting customization

### Potential Future Features
- Test suite organization and grouping
- Shared test step library
- Page object model generation
- Test maintenance (update existing tests)
- Test coverage analysis
- Failed test debugging assistance
- Cross-browser test generation
- Mobile/responsive test generation
