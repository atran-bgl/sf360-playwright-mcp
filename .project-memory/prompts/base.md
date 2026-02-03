# Base Prompt - SF360 Playwright MCP

**Project Type: CLI/Library Package**

---

## Core Responsibilities

You are an AI assistant helping with this project. Your responsibilities:

1. **File Reading**: Read and understand code before suggesting modifications
2. **Git Operations**: ONLY `git log` and `git diff` allowed. All other git commands forbidden. Ask before any git operation.
3. **Task Management**: Use `.project-memory/tasks/` to track work
4. **Spec Adherence**: Follow specifications in `.project-memory/specs/`
5. **Code Quality**: Follow conventions in `.project-memory/conventions.md`
6. **Architecture Alignment**: Follow structure in `.project-memory/architecture.md`

---

## Forbidden Actions

**CRITICAL: You MUST NOT perform these actions without explicit user approval:**

1. **Dependency Changes**
   - NO adding, removing, or upgrading dependencies
   - NO changing package versions in package.json, requirements.txt, etc.
   - ASK FIRST if new dependencies are needed

2. **Configuration Changes**
   - NO modifying tsconfig.json, .eslintrc, .prettierrc, webpack.config, etc.
   - NO changing build configuration
   - ASK FIRST if config changes are needed

3. **Large Refactors**
   - NO rewriting entire files or modules
   - NO changing code structure without approval
   - ASK FIRST if refactoring is needed

4. **Auto-Formatting**
   - NO running formatters on entire files you didn't change
   - ONLY format code you're adding/modifying
   - MATCH existing formatting exactly

5. **Removing Features**
   - NO deleting functions, components, or features
   - NO commenting out large code blocks
   - ASK FIRST if removal is needed

6. **API Changes (CRITICAL for libraries)**
   - NO changing public API signatures (function names, parameters, return types)
   - NO removing exported functions/classes
   - NO changing behavior of existing public APIs
   - ASK FIRST if API changes are needed (breaking changes require major version bump)

7. **Breaking Changes**
   - NO modifications that break backward compatibility
   - NO changes to data formats or protocols
   - ASK FIRST if breaking changes are needed

8. **Build Script Changes**
   - NO modifying build scripts or CI/CD configuration
   - NO changing test scripts
   - ASK FIRST if build changes are needed

9. **New Patterns**
   - NO introducing new coding patterns not found in existing codebase
   - STUDY 2-3 similar files BEFORE writing code
   - MATCH existing patterns exactly

10. **Architecture Changes**
    - NO changing project structure or module organization
    - NO introducing new architectural patterns
    - ASK FIRST if architecture changes are needed

11. **Documentation Files**
    - NO creating massive .md files
    - NO proactive README or documentation creation
    - ONLY create docs when explicitly requested

---

## File Modification Authority

**You CAN modify without approval:**
- Implementation files (src/, lib/, helpers/)
- Test files (tests/, __tests__/)
- Utility functions
- Internal helper modules

**You MUST ask before modifying:**
- Public API entry points (index.ts, main exports)
- Configuration files (tsconfig.json, package.json)
- Build scripts (package.json scripts)
- Documentation (README.md, docs/)
- Template files (templates/)

---

## Change Scope Rules

**Minimal changes only:**
- ONLY change what's required by the task
- NO "improvements" outside the scope
- NO refactoring unrelated code
- NO adding "nice to have" features

**Example:**
- Task: "Fix bug in login function"
- ✅ DO: Fix the bug in login function
- ❌ DON'T: Also refactor nearby functions, add comments, or update related code

---

## Public API Protection (CRITICAL for Libraries)

**This is an npm package. Public API stability is critical.**

**Public API includes:**
- Exported functions in index.js
- MCP tool definitions in mcp-server/src/index.ts
- Template files in templates/ (consumed by users)
- Helper functions in templates/helpers/

**Rules:**
1. **NO breaking changes to public APIs** without user approval
2. **Study existing API patterns** before adding new exports
3. **Maintain backward compatibility** - users depend on this package
4. **Version awareness**:
   - Patch (0.2.0 → 0.2.1): Bug fixes, no API changes
   - Minor (0.2.0 → 0.3.0): New features, backward compatible
   - Major (0.2.0 → 1.0.0): Breaking changes allowed

**Before modifying public APIs, ASK:**
- "This change affects the public API. Is a breaking change acceptable?"
- "Should this be a major version bump?"

---

## Code Style Enforcement

**ALWAYS match existing code style:**
1. **Study similar files first** - Find 2-3 examples, document their patterns
2. **Match formatting** - Indentation, quotes, semicolons
3. **Match structure** - Exports, imports, error handling
4. **Match naming** - camelCase, PascalCase, UPPER_CASE

**DO NOT introduce new patterns found in other projects or documentation.**

---

## Approval Requirements

**Always ASK via AskUserQuestion before:**
- Modifying public APIs
- Adding/removing dependencies
- Changing configuration
- Large refactors
- Breaking changes
- Introducing new patterns

---

## Project Memory File Structure

```
.project-memory/
├── schemas/
│   └── task-schema.json          # Task structure definition
├── tasks/
│   ├── tasks-active.json         # Pending and in-progress tasks
│   └── tasks-completed.json      # Completed tasks
├── specs/
│   └── *.md                      # Feature specifications
├── prompts/
│   ├── base.md                   # This file
│   ├── parse-tasks.md            # Task parsing instructions
│   ├── review.md                 # Code review instructions
│   ├── sync.md                   # Post-commit sync instructions
│   ├── create-spec.md            # Spec creation instructions
│   ├── implement-feature.md      # Implementation instructions
│   └── self-reflect.md           # Mid-implementation check
├── architecture.md               # System architecture
├── conventions.md                # Code conventions
├── useful-commands.md            # Dev/build/test commands
└── commit-log.md                 # Last 20 commits
```

**Task Schema**: Use Read tool to read `.project-memory/schemas/task-schema.json` when creating/validating tasks. Do NOT call get-task-schema (init-only).

---

## Rules

1. **Get Approval**: Ask via AskUserQuestion before forbidden actions
2. **200-Line Limit**: Implementation changes ≤200 lines per file. If larger, break into subtasks.
3. **JSON Format**: Tasks use strict JSON format from task-schema.json
4. **Timestamps**: Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
5. **Spec Reference**: Always link tasks to spec files via specReference field

---

## Documentation Rules

**CRITICAL: Do NOT create massive .md files.**

- Prefer **code documentation** (docstrings, JSDoc comments) for implementation details
- Use markdown files ONLY for essential architecture, setup, and usage guides
- Keep each .md file ≤100 lines
- Split large docs into multiple focused files
- Examples: architecture overview, getting started, API reference (brief)

---

## Task Completion Criteria

**CRITICAL: Always mark task as COMPLETED only when:**

1. **Implementation is verified to work**
   - Code exists and functions as intended
   - Tested manually or via automated tests

2. **Tests pass**
   - Unit tests pass
   - Integration tests pass
   - Or manual verification completed

3. **No blocking issues remain**
   - No errors, no failures
   - All acceptance criteria met

**DO NOT mark tasks complete if:**
- Tests are failing
- Implementation is partial
- Unresolved errors exist
- Cannot find necessary files or dependencies

---

## Security Rules

**NEVER:**
- Commit .env files (keep in .gitignore)
- Hardcode credentials, API keys, or secrets
- Log secrets to console or files
- Write API keys in test files

**ALWAYS:**
- Use environment variables for secrets
- Keep .env in .gitignore
- Define ports in .env (never hardcode)
- Check port conflicts before deployment

---

## Implementation Rules

**Break down complex features into multiple tasks.**

- If a feature requires >5 subtasks or >500 lines of code, split into multiple specs/tasks
- Implement incrementally, test after each task
- Never implement large features in one massive commit

**Guidelines:**
- Small task: 1-2 files, <100 lines, 1-2 acceptance criteria
- Medium task: 2-4 files, 100-200 lines, 2-4 acceptance criteria
- Large task: SPLIT into multiple smaller tasks

---

## Package-Specific Rules

**Template files (templates/):**
- These are copied to user projects during initialization
- Changes affect ALL users who run `npx sf360-mcp-init`
- Test changes in a sample project before committing

**MCP Server (mcp-server/):**
- TypeScript ES modules
- Changes affect Claude's tool calls
- Verify tool descriptions are accurate

**Prompts (templates/prompts/):**
- These guide Claude when users call MCP tools
- Keep prompts clear, actionable, ≤400 lines
- Test prompt changes with actual tool calls
