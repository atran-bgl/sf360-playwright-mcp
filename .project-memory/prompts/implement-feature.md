# Implement Feature

**3-STAGE WORKFLOW: Planning → Implement → Review & Fix**

---

## STAGE 1: PLANNING

### Step 1: Load Context & Get Spec

**A. Read project files (if you haven't this session):**
1. `.project-memory/prompts/base.md` - Forbidden Actions
2. `.project-memory/conventions.md` - Code Style
3. `.project-memory/useful-commands.md` - Commands
4. `.project-memory/architecture.md` - Structure

**Output ALL forbidden actions and commit:**
```
✅ Context Loaded:
FORBIDDEN ACTIONS (list ALL):
- NO large refactors
- NO dependency changes
- NO config changes
- NO public API changes without approval
- [... list all ...]

Commitment: I will NOT perform forbidden actions. If needed, I will STOP and ask first.
```

**B. Get spec and validate:**
- Ask user: spec file path + task reference
- Read spec + `.project-memory/tasks/tasks-active.json`
- Verify: spec clear? tasks have acceptance criteria?

**Output:**
```
✅ Spec Validated:
Spec: [file]
Tasks: [TASK-ID: title, ...]
All have acceptance criteria: [yes/no]
```

---

### Step 2: Analyze & Plan

**A. Check dependencies:**
- Review spec: new packages needed?
- If YES → STOP and ask via AskUserQuestion for approval
- Output: "✅ Using existing stack" OR "❓ Need approval for [package@version]"

**B. Audit for reusable code:**
- Search codebase for similar features (use Glob/Grep)
- Output: "🔍 Reusable: [list]. New: [list]"

**C. Identify modifications:**
- Will you modify existing files?
- If YES → Ask via AskUserQuestion for approval
- Output: "✅ Modifications approved: [files]" OR "✅ Only new files"

---

### Step 3: Create Implementation Plan with TodoWrite

**Structure (for each task in order):**

1. "Study code patterns for [TASK-ID]"
   - Find 2-3 similar files, document naming/structure/formatting
2. "Implement [TASK-ID]: [title]"
   - Mental checklist: follows spec? DRY? no new patterns? protected areas?
   - Verify acceptance criteria before marking complete
3. **Mid-point review (if 4+ tasks or high complexity):**
   - "Mid-point self-reflect - call project-memory self-reflect"
4. **Quality checks:**
   - "Run linter and fix errors"
   - "Run build - must succeed"
   - "Run tests - all must pass"
5. **Final review:**
   - "Call project-memory review"
   - "Fix issues from review"
   - "Final verification - all acceptance criteria met"

**Insert self-reflect checkpoints every 2-3 tasks for complex work.**

**CHECKPOINT: Get user approval to proceed.**

---

## STAGE 2: IMPLEMENTATION

### For each "Study code patterns" todo:

1. Mark todo as `in_progress`
2. Find 2-3 similar files (Glob/Grep)
3. Read completely
4. Document patterns:
   ```
   🔍 Code Patterns from [files]:
   - Naming: [camelCase/PascalCase]
   - Structure: [exports/imports/error handling]
   - Formatting: [indentation/quotes/semicolons]
   - Patterns: [async-await/functional/class-based]
   ```
5. Mark as `completed`

**CRITICAL: Output patterns BEFORE writing code.**

---

### For each "Implement [TASK-ID]" todo:

1. Mark as `in_progress`
2. Re-read task acceptance criteria + spec section
3. Output implementation approach

**Mental checklist as you write:**
- ✓ Follows spec?
- ✓ Is DRY (no duplication)?
- ✓ No new patterns?
- ✓ Modifying business logic? → Ask first if YES
- ✓ Modifying UI/UX? → Ask first if YES

4. Write code:
   - Match patterns from study step
   - Follow conventions.md
   - Handle edge cases
   - Apply security rules

5. **MANDATORY checkpoint - Verify acceptance criteria:**
   ```
   ✅ [TASK-ID] Verification:
   ✅ Criterion 1: [implemented] - [file:line]
   ✅ Criterion 2: [implemented] - [file:line]
   ✅ Follows spec
   ✅ Code is DRY
   ✅ No new patterns
   ✅ No forbidden actions
   ```
   **If ANY is ✗ → fix before marking complete**

6. Mark as `completed`

---

### If "Mid-point self-reflect" todo:

- STOP implementation
- Mark as `in_progress`
- Call: `mcp__project-memory__self-reflect`
- Address critical issues
- Mark as `completed`
- Continue with remaining todos

---

## STAGE 3: REVIEW & FIX

### Quality Check Todos:

**"Run linter":**
- Mark as `in_progress`
- Run: `npm run lint`
- Fix ALL errors/warnings
- Output: "✅ Linter: passed"
- Mark as `completed`

**"Run build":**
- Mark as `in_progress`
- Run: `npm run build`
- Must succeed
- Output: "✅ Build: success"
- Mark as `completed`

**"Run tests":**
- Mark as `in_progress`
- Run: `npm test`
- All must pass
- Output: "✅ Tests: [X/X passed]"
- Mark as `completed`

---

### Review Todos:

**"Call project-memory review":**
- Mark as `in_progress`
- Run: `mcp__project-memory__review`
- Output feedback
- Mark as `completed`

**"Fix issues from review":**
- Mark as `in_progress`
- Address critical and important issues
- Re-run: linter, build, tests
- If significant changes → review again
- Output: "✅ Fixed: [list]"
- Mark as `completed`

---

### Final Verification:

**"Final verification":**
- Mark as `in_progress`
- Verify ALL tasks:
  ```
  ✅ Final Verification:

  [TASK-ID]: [title]
  ✅ All acceptance criteria met - [file:line]

  Code Quality:
  ✅ Linter passed
  ✅ Build succeeded
  ✅ All tests passed
  ✅ Review feedback addressed
  ✅ No forbidden actions violated
  ```
- Mark as `completed`

**Final output:**
```
✅ Implementation Complete - Ready for Commit

Tasks completed: [list]
Files modified/created: [list with descriptions]
Quality gates: ✅ All passed

Next steps:
1. Review git diff (optional)
2. Commit changes
3. Run project-memory sync after commit
```

---

## Essential Rules

**Stage 1 (Planning):**
- ✓ Load context - understand ALL forbidden actions
- ✓ Validate spec and tasks
- ✓ Create detailed todo list with TodoWrite

**Stage 2 (Implementation):**
- ✓ Study patterns BEFORE implementing (find 2-3 similar files)
- ✓ Check protected areas (business logic, UI/UX, public APIs) → ask first
- ✓ Verify acceptance criteria BEFORE marking task complete
- ✓ Call mid-point review if 4+ tasks or high complexity

**Stage 3 (Review & Fix):**
- ✓ Run linter, build, tests - all must pass
- ✓ Call project-memory review
- ✓ Fix issues
- ✓ Final verification of all acceptance criteria

**Mental Checklist:** Follows spec? DRY? No new patterns? Protected areas checked?

Done!
