# SF360 Test Generator MCP - Specification

This directory contains the complete specification for the SF360 Playwright Test Generator MCP server.

## Overview

An MCP (Model Context Protocol) server that generates Playwright tests from natural language specifications. Following the **pure prompt provider** pattern (like project-memory-mcp), it returns structured instructions for Claude to execute using existing tools.

## Key Features

- **Natural Language Input**: Describe tests in plain English
- **Automatic Login**: Generated tests include SF360 login setup via auth helper
- **Smart Element Discovery**: Prefers data-testid, falls back to accessibility roles
- **Interactive Guidance**: Asks clarifying questions when needed
- **Assertion Generation**: Creates expect() statements from expected outcomes

## Specification Documents

1. **[1-architecture.md](./1-architecture.md)** - System design and MCP architecture
2. **[2-requirements.md](./2-requirements.md)** - User requirements and constraints
3. **[3-tool-definitions.md](./3-tool-definitions.md)** - All 4 MCP tools with schemas
4. **[4-prompt-design.md](./4-prompt-design.md)** - What each prompt instructs Claude to do
5. **[5-implementation-guide.md](./5-implementation-guide.md)** - Step-by-step implementation
6. **[6-example-workflows.md](./6-example-workflows.md)** - Concrete usage examples
7. **[7-configuration.md](./7-configuration.md)** - Installation and setup
8. **[8-verification.md](./8-verification.md)** - Testing and success criteria

## Quick Start (After Implementation)

### For Users
```bash
# Generate a test
"Generate a test for Badge settings - verify user can create a new badge"

# Discover page elements
"Discover all elements on the SuperStream Dashboard page"
```

### For Implementers
1. Read [1-architecture.md](./1-architecture.md) for system design
2. Follow [5-implementation-guide.md](./5-implementation-guide.md) step-by-step
3. Refer to [4-prompt-design.md](./4-prompt-design.md) for prompt templates
4. Test with [8-verification.md](./8-verification.md) validation plan

## Implementation Timeline

**Estimated**: ~5.5 hours for complete implementation

- Phase 1: MCP Server Foundation (30 min)
- Phase 2: Prompt Development (2 hours)
- Phase 3: Server Implementation (1 hour)
- Phase 4: Installation & Configuration (30 min)
- Phase 5: Testing & Validation (1 hour)
- Phase 6: Documentation (30 min)

## Status

**Current**: Specification complete, awaiting implementation

**Next Steps**:
1. Review specification with stakeholders
2. Gather feedback and refine
3. Begin Phase 1 implementation
4. Update specs as implementation progresses

## Related Projects

- **project-memory-mcp**: Reference implementation for MCP architecture
- **sf360-playwright-mcp**: Test framework this MCP will enhance
- **Playwright MCP**: Provides browser automation tools this MCP will orchestrate

## Questions or Feedback

Contact: Anna Tran (@atran-bgl)
