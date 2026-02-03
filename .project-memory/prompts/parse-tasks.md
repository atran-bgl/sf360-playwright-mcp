# Task Parsing

You are helping parse tasks from a spec or implementation plan.

## Task Schema

{
  "tasks": [
    {
      "id": "string (unique identifier, e.g., TASK-001)",
      "title": "string (brief task description)",
      "description": "string (detailed description)",
      "status": "pending | in_progress | completed",
      "priority": "low | medium | high | critical",
      "acceptanceCriteria": ["string array of criteria"],
      "dependencies": ["array of task IDs this depends on"],
      "subtasks": [
        {
          "id": "string (e.g., TASK-001-1)",
          "title": "string",
          "status": "pending | in_progress | completed",
          "acceptanceCriteria": ["optional criteria"]
        }
      ],
      "specReference": "string (path to spec file, e.g., specs/feature-auth.md)",
      "complexity": "string (optional: simple, moderate, complex)",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "completedAt": "ISO 8601 timestamp (null if not completed)"
    }
  ]
}

Notes:
- tasks-active.json contains tasks with status: pending or in_progress
- tasks-completed.json contains tasks with status: completed
- Claude moves tasks between files when status changes
- subtasks can be nested for breaking down complex tasks
- specReference tracks which spec file the task originated from

## Instructions

### Step 1: Detect Task Storage Structure

Check .project-memory/tasks/ to determine file organization:

**Single-file structure (small/medium projects):**
- `tasks-active.json` - Contains all active tasks
- `tasks-completed.json` - Contains all completed tasks

**Multi-file structure (large projects):**
- `tasks-index.json` - Domain registry and metadata
- `tasks-active_{domain}.json` - Domain-specific active tasks
- `tasks-completed_{domain}.json` - Domain-specific completed tasks

If `tasks-index.json` exists, use multi-file structure. Otherwise use single-file.
If task structure is not found, assess project size/spec complexity to choose structure.

### Step 2: Parse Tasks from Spec

1. Read the spec file from .project-memory/specs/ or from the user's message
2. Extract tasks with unique IDs (TASK-001, TASK-002, etc.)
3. Assign to domains if multi-file structure (infer from task description/type)
4. Include: title, description, acceptance criteria, dependencies, priority, subtasks if needed
5. Set specReference field to the spec file path

**CRITICAL: If user references a spec file, MUST include specReference in every task**
- specReference links tasks back to their source specification
- Format: `"specReference": "specs/feature-name.md"`
- This enables traceability between specs and implementation
- NEVER create tasks from a spec without setting specReference

### Step 3: Check Existing Tasks & Codebase

**CRITICAL: Avoid duplicates and already-implemented tasks**

**Check existing tasks (both active AND completed):**

For single-file structure:
- Read tasks-active.json AND tasks-completed.json
- Compare new tasks against both files

For multi-file structure:
- Read ALL `tasks-active_{domain}.json` AND `tasks-completed_{domain}.json`
- Compare new tasks against all files

**Check codebase for already-implemented features:**
- For each parsed task, verify if it's already implemented in code
- Read relevant source files to confirm implementation status
- Check: Does the feature exist? Does it work as described?

**OUTPUT REQUIRED - Show validation results:**
```
📋 Task Validation:
✅ NEW: TASK-001 - [title] (not in tasks, not in code)
⚠️ DUPLICATE: TASK-002 - [title] (already in tasks-active.json)
⚠️ IMPLEMENTED: TASK-003 - [title] (already in code at src/...)
❌ FALSE COMPLETE: TASK-004 - [title] (in completed tasks but NOT in code!)
```

**Actions based on validation:**
- **NEW** → Add to active tasks
- **DUPLICATE** → Skip (already tracked)
- **IMPLEMENTED** → Add directly to completed tasks (not active)
- **FALSE COMPLETE** → Flag to user: "Task marked complete but not implemented. Re-add to active?"

**CRITICAL: Always verify against codebase, not just task status**

### Step 4: Show Parsed Tasks to User

- Display parsed tasks via AskUserQuestion for approval
- Show which file(s) they will be written to

### Step 5: Update Task Files After Approval

**For single-file structure:**
- Update tasks-active.json using Write or Edit tool

**For multi-file structure:**
- Update relevant `tasks-active_{domain}.json` file(s)
- Update `tasks-index.json` with new task counts and domains

Remember: Get user approval before writing any files.
