# Create Specification

Create detailed, actionable spec from user requirements, validated against existing codebase.

**CRITICAL: Specs ≤200 lines each. Use modular specs for complex features.**

---

## Step 0: Load Project Context - MANDATORY

**Read these files NOW if you haven't this session:**
1. `.project-memory/prompts/base.md` - Forbidden Actions, Public API Protection
2. `.project-memory/conventions.md` - Code conventions
3. `.project-memory/useful-commands.md` - Commands
4. `.project-memory/architecture.md` - System structure

**Verify and output:**
```
✅ Context Loaded:
Forbidden Actions: [list ALL]
Conventions: [2-3 key patterns]
Commands: [build/test/lint]
Architecture: [key components]
```

---

## Step 1: Initialize & Sync

1. Check `.project-memory/` exists: `ls -la .project-memory`
2. If NOT exists → Run `project-memory init` first
3. If exists → Run `project-memory sync` to get latest state
4. **CHECKPOINT:** Wait for sync completion

---

## Step 2: Determine Spec Structure

**Ask via AskUserQuestion:**
"Is this a large/complex feature that should be split?"

Options:
1. Single spec (simple features, ≤200 lines)
2. Modular specs (complex features, multiple files ≤200 lines each)

**If modular:**
- `[feature]-overview.md` (≤100 lines) - Master spec with links
- `[feature]-backend.md` (≤200 lines) - API, database, logic
- `[feature]-frontend.md` (≤200 lines) - UI, user flows
- `[feature]-security.md` (≤200 lines) - Auth, validation, OWASP
- `[feature]-tests.md` (≤200 lines) - Test strategy
- `[feature]-tasks.md` (≤200 lines) - Implementation plan

---

## Step 3: Gather Requirements

**Read user requirements:**
- File path → Read file
- Message → Use content

**Clarify via AskUserQuestion:**
- Unclear requirements?
- Missing user story?
- Vague acceptance criteria?
- Technology choices?

**Ask for context:**
1. Part of larger system? (microservices, monorepo)
2. External integrations?
3. Performance/security requirements?
4. Who are the users?
5. Existing patterns to follow?
6. Expected scale/load?

---

## Step 4: Check Dependencies

**If new dependencies needed:**

1. **Fetch latest versions via WebFetch:**
   - npm: `https://registry.npmjs.org/[package]/latest`
   - Get: version, release date, description

2. **Check compatibility:**
   - Read package.json
   - Check peer dependencies
   - Verify runtime version compatibility

3. **Output:**
   ```
   📦 New Dependencies:
   Proposed: [package@version]
   Latest: [version]
   Compatibility: [✅/⚠️/❌]
   Recommendation: [proceed/needs resolution]
   ```

4. **If conflicts → Ask user how to proceed**

**If no new dependencies:**
- Output: "✅ Using existing tech stack"

---

## Step 5: Analyze Codebase

**Required analysis:**
1. Read project memory files
2. Read actual code:
   - package.json, tsconfig.json
   - src/, lib/, templates/
   - tests/
   - Relevant modules
3. Identify:
   - Existing patterns
   - Integration points
   - Similar features

**Flag inconsistencies:**
- Conflicts with architecture
- Missing dependencies
- Breaking changes needed
- Compatibility issues

**CHECKPOINT:** If conflicts found, ask user how to proceed

---

## Step 6: Design Spec Content

### For SINGLE SPEC (≤200 lines):

**Sections:**
1. Overview: Purpose, scope, user story
2. Requirements: Functional, non-functional
3. Technical Design: Architecture, components, data flow
4. Security: Auth, validation, secrets, OWASP
5. Edge Cases: Errors, fallbacks, logging
6. Testing: Unit/integration/E2E/security
7. Tasks: Implementation steps (brief)
8. Maintainability: Conventions, documentation

### For MODULAR SPECS:

**Each file has:**
- Related Specs section (cross-links)
- Focused content ≤200 lines
- Independently readable

**Overview:** Purpose, scope, success criteria
**Backend:** API, database, business logic
**Frontend:** UI, user flows, state
**Security:** Auth, validation, OWASP
**Tests:** Test cases, coverage
**Tasks:** Implementation plan, dependencies

---

## Step 7: Validate Spec

**Required validation:**
1. Architecture alignment?
2. Tech stack compatibility?
3. Integration feasibility?
4. Security addressed?
5. Test coverage?
6. Maintainability?
7. Line count ≤200 per file?

**Show user:**
- ✅ Validated
- ⚠️ Warnings
- ❌ Blockers

**CHECKPOINT:** Get user approval

---

## Step 8: Write Spec File(s)

### For SINGLE SPEC:

**Filename:** `.project-memory/specs/[feature-name].md`

**Header:**
```markdown
# [Feature Name] Specification

**Status:** Draft | **Created:** [YYYY-MM-DD] | **Updated:** [YYYY-MM-DD]

> Immutable spec. Once approved, implementation follows this spec.
```

### For MODULAR SPECS:

**Each file header:**
```markdown
# [Feature Name] - [Domain] Specification

**Status:** Draft | **Created:** [YYYY-MM-DD]

**Related Specs:**
- [Overview](./ [feature]-overview.md)
- [Backend](./ [feature]-backend.md)
- ...
```

**Write all files, verify ≤200 lines each**

---

## Step 9: Parse Tasks (Optional)

Ask user: "Spec(s) created. Parse tasks now?"

If yes:
- Single spec → Run `project-memory parse-tasks` on spec
- Modular specs → Run on [feature]-tasks.md

---

## Rules

- Initialize/sync first
- Ask: single or modular?
- Clarify ambiguity
- Ask for context
- Validate against code
- Focus on security (Auth, validation, OWASP)
- Include edge cases
- Include tests
- Keep maintainable
- Write for agents (clear, actionable)
- Respect line limits (≤200 per file)
- Cross-reference modular specs

Done!
