# CRITICAL: Test Data Isolation Principle

**Date**: 2026-02-03
**Issue**: Test plan relied on existing discovered entities
**Impact**: Tests would fail if data changed (deleted/modified)
**Resolution**: Updated test-plan prompt with explicit guidance

---

## The Problem Discovered

### What Happened

During planning for "workflow entities search test", the initial plan used:

```javascript
// ❌ BAD - Used discovered existing entities
{
  "searchTerms": {
    "exact": "ERICNEWC8529",  // Found during page exploration
    "partial": "Eric"          // Assumes 2 entities exist
  },
  "expectedResults": {
    "exactMatch": { "count": 1 },
    "partialMatch": { "count": 2 }
  }
}
```

### Why This Is Wrong

**Brittle Test:**
- ❌ Depends on "ERICNEWC8529" existing forever
- ❌ Assumes no other "Eric" entities will be added
- ❌ Test failure doesn't mean search is broken - could just be data changed
- ❌ Cannot run in parallel (data conflicts)
- ❌ Not repeatable across environments

**User Feedback:**
> "What if ERIC fund is deleted by a user in subsequent test, then your test would fail"

**This is absolutely correct!** The test plan violated fundamental testing principles.

---

## The Solution

### Golden Rule Added to Prompt

**NEVER rely on existing data discovered during page exploration!**

### Correct Pattern

```javascript
// ✅ GOOD - Create own test data
{
  "testDataCreation": {
    "fund1": {
      "code": "SEARCHTEST1",
      "name": "SearchTest1 {{timestamp}}"  // Unique!
    },
    "fund2": {
      "code": "SEARCHTEST2",
      "name": "SearchTest2 {{timestamp}}"  // Unique!
    }
  },
  "searchTerms": {
    "exact": "SEARCHTEST1",
    "partial": "{{timestamp}}",  // Guaranteed to match exactly 2
    "noResults": "NOTFOUND{{timestamp}}"
  }
}
```

### Test Steps Pattern

```javascript
[
  { "step": 1, "description": "Authenticate", "type": "setup" },
  { "step": 2, "description": "Create 2 test funds", "type": "setup" },  // ← CRITICAL!
  { "step": 3, "description": "Navigate to page", "type": "setup" },
  { "step": 4, "description": "Search for fund1 - expect 1", "type": "action" },
  { "step": 5, "description": "Search timestamp - expect 2", "type": "action" },
  { "step": 6, "description": "Search nothing - expect 0", "type": "assertion" }
]
```

---

## Changes Made to Prompt

### 1. Added Prominent Warning Section

```markdown
## ⚠️ CRITICAL: Test Data Isolation Principle

**NEVER rely on existing data that was discovered during page exploration!**
```

This appears at the very top of the prompt, before any other instructions.

### 2. Added Examples of Bad vs Good

Clear side-by-side comparison showing:
- ❌ What NOT to do (use discovered entities)
- ✅ What TO do (create test data)

### 3. Added Dedicated Planning Step

**Step 7: Plan Test Data Creation Strategy**

This is now a mandatory step in the planning process, with patterns for:
- Search/Filter tests
- CRUD tests
- Tests that need pre-existing entities

### 4. Added Final Checklist

```markdown
Before returning the plan, verify:
- [ ] Test creates its own unique test data (uses timestamps)
- [ ] Test does NOT rely on discovered existing entities
- [ ] Test data creation is step 2 (after auth, before navigation)
```

### 5. Clarified Discovery Purpose

```markdown
### Use Discovery Data ONLY For:
- ✅ Finding selectors (button labels, input placeholders)
- ✅ Understanding page structure (forms, tables, modals)
- ✅ Identifying required fields
- ❌ NOT for test assertions or expected data
```

---

## Why This Matters

### Test Quality Principles

1. **Isolation**: Each test is self-contained
2. **Repeatability**: Same result every time
3. **Predictability**: Known initial state
4. **Reliability**: Doesn't fail due to external changes
5. **Parallelization**: Can run multiple tests simultaneously

### Real-World Impact

**Before (Brittle):**
```
Day 1: Test passes ✅ (Eric entities exist)
Day 2: Test fails ❌ (Someone deleted ERICNEWC8529)
Developer: "Is the search broken or just the data?"
Result: Wasted time debugging, false alarm
```

**After (Robust):**
```
Day 1: Test creates data → passes ✅
Day 2: Test creates data → passes ✅
Day 30: Test creates data → passes ✅
Developer: "If it fails, search is actually broken"
Result: Confidence in test results
```

---

## Application to All Test Types

This principle applies to ALL tests, not just search:

### Create Tests
```javascript
// ✅ Create unique entity
const member = {
  firstName: `TestMember${timestamp}`,
  lastName: "AutoTest"
};
// Verify member was created
```

### Edit Tests
```javascript
// ✅ Create entity, then edit it
const member = await createMember(...);
await editMember(member.id, { firstName: "Updated" });
// Verify update succeeded
```

### Delete Tests
```javascript
// ✅ Create entity, then delete it
const member = await createMember(...);
await deleteMember(member.id);
// Verify it's gone
```

### Search/Filter Tests
```javascript
// ✅ Create known entities, then search
const fund1 = await createFund({ name: `Test${timestamp}` });
const fund2 = await createFund({ name: `Test${timestamp}` });
await search(timestamp);
// Verify exactly 2 results
```

---

## Integration with Test Fixture Factory

The test-plan tool must work with the auth/fixture system:

### Fund Creation (if requiresFund: true)
```javascript
// Automatically handled by setupTest()
const ctx = await setupTest(page, {
  firm: process.env.FIRM,
  pageKey: 'workflow_entities'
});
// ctx.fundId available if page requires fund
```

### Additional Test Data
```javascript
// Test creates its own additional entities
const testFund1 = await createFundViaAPI({
  name: `SearchTest1 ${Date.now()}`
});
const testFund2 = await createFundViaAPI({
  name: `SearchTest2 ${Date.now()}`
});
```

**See Also:**
- `.project-memory/specs/test-fixture-factory/active.auth-fund-creation.md`
- `.project-memory/specs/test-fixture-factory/active.auth-data-factory.md`

---

## Enforcement in Tooling

### In test-plan Tool
- Prompt explicitly warns against using discovered data
- Includes checklist to verify test data is created
- Provides patterns for common test types

### In test-generate Tool
- Should validate plan includes test data creation
- Should warn if assertions reference hardcoded entity names

### In test-evaluate Tool
- If test fails with "entity not found", suggest data creation issue
- Check if test creates data before using it

---

## Examples of Correct Plans

### Example 1: Search Test
```json
{
  "testDataCreation": {
    "entities": [
      { "type": "fund", "name": "SearchA {{timestamp}}" },
      { "type": "fund", "name": "SearchB {{timestamp}}" }
    ]
  },
  "testSteps": [
    { "step": 1, "description": "Auth", "type": "setup" },
    { "step": 2, "description": "Create 2 funds", "type": "setup" },
    { "step": 3, "description": "Search timestamp → expect 2", "type": "action" }
  ]
}
```

### Example 2: CRUD Test
```json
{
  "testDataCreation": {
    "member": {
      "firstName": "TestMember{{timestamp}}",
      "lastName": "Auto"
    }
  },
  "testSteps": [
    { "step": 1, "description": "Auth + create fund", "type": "setup" },
    { "step": 2, "description": "Navigate to members", "type": "setup" },
    { "step": 3, "description": "Create member", "type": "action" },
    { "step": 4, "description": "Verify in list", "type": "assertion" }
  ]
}
```

---

## Summary

**What we learned:**
- Tests must create their own data
- Discovery finds selectors, not test data
- Timestamps ensure uniqueness
- Test data creation is always step 2

**What changed:**
- Updated test-plan prompt with explicit guidance
- Added examples, warnings, and checklist
- Clarified discovery purpose

**Result:**
- Future test plans will create isolated, reliable tests
- Tests won't break due to external data changes
- Tests can run in parallel without conflicts

**Key takeaway:**
> "Use discovery to learn HOW to interact with the page, not WHAT data to assert on."

---

## Related Specs

- `00-architecture-overview.md` - Auth system integration
- `01-test-plan-tool.md` - Full test-plan specification
- `active.auth-fund-creation.md` - Fund/member creation APIs
- `active.auth-data-factory.md` - Data generation utilities
