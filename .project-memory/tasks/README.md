# SF360 Playwright MCP - Implementation Tasks

**Total Tasks**: 29 tasks across 6 phases (6 weeks)

---

## Task Organization

Tasks are organized by implementation phase in separate JSON files:

### Phase 1: Authentication Foundation (Week 1)
**File**: `phase1.auth-foundation.json`
**Tasks**: 7 (P1-001 to P1-007)
**Priority**: Critical
**Focus**: API-based auth with Cognito JWT + TOTP, SSO login, token caching, data factories

### Phase 2: Test Fixtures (Week 2)
**File**: `phase2.test-fixtures.json`
**Tasks**: 6 (P2-001 to P2-006)
**Priority**: Critical
**Focus**: Fund creation API, member creation (3-step), setupTest() implementation

### Phase 3: MCP Tools (Week 3)
**File**: `phase3.mcp-tools.json`
**Tasks**: 6 (P3-001 to P3-006)
**Priority**: Critical
**Focus**: 4 MCP tools (test-plan, test-generate, test-evaluate, test-report)

### Phase 4: Structure & Cleanup (Week 4)
**File**: `phase4.cleanup-structure.json`
**Tasks**: 4 (P4-001 to P4-004)
**Priority**: Medium
**Focus**: Test folder structure, legacy cleanup, package updates

### Phase 5: Testing & Validation (Week 5)
**File**: `phase5.testing-validation.json`
**Tasks**: 4 (P5-001 to P5-004)
**Priority**: High
**Focus**: Unit tests, integration tests, E2E tests, documentation

### Phase 6: Release (Week 6)
**File**: `phase6.release.json`
**Tasks**: 2 (P6-001 to P6-002)
**Priority**: Medium
**Focus**: Release preparation, build, and publish

---

## Task Status Tracking

### Using the Task Files

Each phase file contains:
- Phase metadata (name, duration, priority)
- Task array with complete details
- Task fields: id, title, description, status, priority, acceptanceCriteria, dependencies, specReference, complexity, timestamps

### Updating Task Status

When working on a task:
1. Open the relevant phase file (e.g., `phase1.auth-foundation.json`)
2. Find the task by ID (e.g., `P1-001`)
3. Update `status` field: `"pending"` → `"in_progress"` → `"completed"`
4. Update `updatedAt` timestamp
5. Set `completedAt` timestamp when done

### Moving Completed Tasks

Option 1: Keep in phase files with `"status": "completed"`
Option 2: Move to `tasks-completed.json` when phase is done

---

## Task Dependencies

### Critical Path

```
P1-001 (Dependencies)
  ├─ P1-002 (Cognito Auth)
  │   ├─ P1-003 (Token Cache)
  │   └─ P1-004 (SSO Login)
  │       ├─ P2-001 (Fund Creation)
  │       │   └─ P2-002 (Member Creation)
  │       │       └─ P2-003 (setupTest)
  │       │           └─ P2-004 (Cache Methods)
  │       └─ P2-006 (Helper Modules)
  │
  ├─ P1-005 (Data Factories) [independent]
  ├─ P1-006 (Env Template) [independent]
  └─ P1-007 (Gitignore) [independent]

P3-001 to P3-005 [mostly independent, can be parallel]
  └─ P3-006 (Orchestration docs)

P4-001 to P4-004 [independent]

P5-001 to P5-003 [can be parallel]
  └─ P5-004 (Documentation)
      └─ P6-001 (Release Prep)
          └─ P6-002 (Publish)
```

### Blockers

- **Phase 2** blocked until Phase 1 complete
- **Phase 3** can start independently (prompts only)
- **Phase 4** can start independently
- **Phase 5** blocked until Phases 1-3 complete
- **Phase 6** blocked until Phase 5 complete

---

## Progress Tracking

### By Phase

| Phase | Total | Pending | In Progress | Completed |
|-------|-------|---------|-------------|-----------|
| Phase 1 | 7 | 7 | 0 | 0 |
| Phase 2 | 6 | 6 | 0 | 0 |
| Phase 3 | 6 | 6 | 0 | 0 |
| Phase 4 | 4 | 4 | 0 | 0 |
| Phase 5 | 4 | 4 | 0 | 0 |
| Phase 6 | 2 | 2 | 0 | 0 |
| **Total** | **29** | **29** | **0** | **0** |

### By Priority

| Priority | Count | Percentage |
|----------|-------|------------|
| Critical | 14 | 48% |
| High | 10 | 34% |
| Medium | 4 | 14% |
| Low | 1 | 3% |

---

## Spec References

All tasks include `specReference` field linking to specification:

**Auth System**:
- `.project-memory/specs/test-fixture-factory/active.auth-cognito.md`
- `.project-memory/specs/test-fixture-factory/active.auth-sso-login.md`
- `.project-memory/specs/test-fixture-factory/active.auth-token-caching.md`
- `.project-memory/specs/test-fixture-factory/active.auth-data-factory.md`
- `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`
- `.project-memory/specs/test-fixture-factory/active.auth-member-creation.md`
- `.project-memory/specs/test-fixture-factory/active.auth-setup-test-api.md`

**MCP Tools**:
- `.project-memory/specs/mcp-tool-based-test-generation/01-test-plan-tool.md`
- `.project-memory/specs/mcp-tool-based-test-generation/02-test-generate-tool.md`
- `.project-memory/specs/mcp-tool-based-test-generation/03-test-evaluate-tool.md`
- `.project-memory/specs/mcp-tool-based-test-generation/04-test-report-tool.md`
- `.project-memory/specs/mcp-tool-based-test-generation/05-orchestration-guide.md`
- `.project-memory/specs/mcp-tool-based-test-generation/06-mcp-server-integration.md`
- `.project-memory/specs/mcp-tool-based-test-generation/07-test-folder-structure.md`

---

## Next Steps

### Start Implementation

1. **Begin with Phase 1** (most critical, blocks other phases)
2. Start with **P1-001** (add dependencies)
3. Follow dependency chain: P1-001 → P1-002 → P1-003, P1-004
4. Independent tasks (P1-005, P1-006, P1-007) can be done anytime

### Tracking Progress

1. Update task status as you work
2. Mark blockers if encountered
3. Update timestamps
4. Document any deviations from specs

### Getting Help

- Refer to spec files for implementation details
- Each task has acceptance criteria for validation
- Dependencies show prerequisite tasks

---

*Created: 2026-02-02*
*Last Updated: 2026-02-02*
