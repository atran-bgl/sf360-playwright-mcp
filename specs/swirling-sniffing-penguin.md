# SuperStream Dashboard - Complete Codebase Review Plan

**Review Date:** 2026-01-12
**Review Scope:** Entire codebase
**Branch:** rollover-modal-refactor

## Executive Summary

**Review Focus:** Refactored rollover implementation in `src/pages/fund/rollovers/`

This review examines the NEW refactored code (not the old implementation in `src/pages/fund/common/requestARollover/`).

Comprehensive codebase review completed covering:
- **73 source files** in NEW rollovers implementation (`src/pages/fund/rollovers/`)
- **10 test files** with 1 failing test
- **2,055 lines** in core utilities (util.ts, typeDef.ts, Contexts.ts)
- **23 specification files** in .project-memory/specs/
- **OLD code** in `src/pages/fund/common/requestARollover/` was NOT reviewed (pending deprecation)

### Key Findings - NEW Refactored Code

**Location:** `src/pages/fund/rollovers/`

✅ **Strengths:**
- IRR modal implementation is 90% complete and well-architected
- Follows spec architecture from `.project-memory/specs/` closely
- Strong TypeScript typing with minimal `any` usage (5 instances)
- Excellent test coverage for MemberDetailsPanel (7 test files)
- Clean separation of concerns and reusable components
- Successfully implements validation-via-refs pattern
- URL-based modal routing working correctly

❌ **Critical Issues:**
- **SECURITY**: JWT token exposed on window object (XSS risk) - in `src/common/util.ts`
- **SECURITY**: No input sanitization on URL parameters - in `src/common/util.ts`
- RTR and RA/RAS modals not yet refactored (still using old code)
- History Tab not implemented in refactored structure (placeholder only)
- 1 failing test in TransactionDetailsPanel
- Old code in `src/pages/fund/common/requestARollover/` still in use for RTR/RA

⚠️ **Medium Priority:**
- Inline styles violate Tailwind-first convention
- Missing docstrings on most functions (convention violation)
- jQuery dependency in React code
- Large context interfaces causing unnecessary re-renders

### Detailed Review Documents

The full review is split into manageable sections:

1. **[1-implementation-status.md](../code_review/2026-01-12/1-implementation-status.md)**
   - Rollover implementation status vs specs
   - Component inventory (implemented vs missing)
   - Feature completion percentages
   - Critical files and their purposes

2. **[2-code-quality-issues.md](../code_review/2026-01-12/2-code-quality-issues.md)**
   - TypeScript issues (any types, type safety)
   - React hook issues (dependencies, stale closures)
   - Code organization and patterns
   - Convention adherence scorecard

3. **[3-security-issues.md](../code_review/2026-01-12/3-security-issues.md)**
   - Critical security vulnerabilities
   - JWT storage issues
   - Input validation gaps
   - Security recommendations

4. **[4-testing-recommendations.md](../code_review/2026-01-12/4-testing-recommendations.md)**
   - Test coverage analysis
   - Failing test details
   - Testing gaps
   - Test quality assessment

## Critical Files to Address

### High Priority (Security & Correctness)
1. `src/common/util.ts:74` - JWT on window object
2. `src/common/util.ts:31-45` - URL parameter injection risk
3. `src/common/util.ts:364` - BSB validation bug (string comparison)
4. `src/pages/fund/rollovers/commonPanels/IrrTransactionDetailsPanel/tests/BasicRender.test.tsx` - Fix failing test

### Medium Priority (Continue Refactoring)
5. Refactor RTR modal to new structure (currently using old code, ~2000 lines)
6. Refactor RA/RAS modal to new structure (currently using old code, ~1500 lines)
7. Implement History Tab in refactored structure (placeholder only, ~500 lines)
8. Complete IRR Reject workflow in refactored structure (stubbed, ~200 lines)
9. Deprecate old code in `src/pages/fund/common/requestARollover/` once refactor complete

### Low Priority (Code Quality)
9. Add docstrings to util.ts functions (convention violation)
10. Replace inline styles with Tailwind classes (multiple files)
11. Remove jQuery from useOptionsAdjust hook
12. Split large context interfaces

## Verification Plan

After addressing issues:

1. **Security Verification**
   ```bash
   # Verify JWT no longer on window object
   grep -r "window.JWT_TOKEN" src/

   # Verify input sanitization added
   grep -r "getAuthParams" src/common/util.ts
   ```

2. **Test Verification**
   ```bash
   yarn test
   # Should show: "10 passed" (currently 9 passed, 1 failed)
   ```

3. **Type Safety Verification**
   ```bash
   tsc -b
   # Should complete with no errors

   grep -r "as any" src/
   # Should show minimal or zero results
   ```

4. **Lint Verification**
   ```bash
   yarn lint
   # Should pass with no errors
   ```

5. **Build Verification**
   ```bash
   yarn build
   # Should complete successfully
   ```

## Next Actions

Review the detailed documents in order:
1. Read implementation status to understand what's complete
2. Review code quality issues for quick fixes
3. Review security issues (URGENT - address immediately)
4. Review testing recommendations for coverage gaps

Then proceed with implementation of fixes based on priority.

---

**Total Review Lines:** ~1200 lines split across 4 documents (300 lines each)
**Estimated Effort:**
- Critical fixes: 2-3 days
- Feature completion (RTR/RA/History): 2-3 weeks
- Code quality improvements: 1 week
