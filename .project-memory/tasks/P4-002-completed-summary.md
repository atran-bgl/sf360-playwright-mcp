# P4-002 Completed: Legacy Cleanup

**Task**: Remove legacy directory and backup old auth.js
**Status**: ✅ COMPLETED
**Date**: 2026-02-02

---

## ✅ Actions Completed

### 1. Backed Up Current auth.js
- ✅ Copied `templates/helpers/auth.js` → `templates/helpers/auth.js.OLD`
- ✅ Created `auth.js.OLD.README.txt` with detailed explanation
- ✅ Backup size: 18KB (569 lines of UI-based auth code)

### 2. Removed Legacy Directory
- ✅ Deleted `.playwright-test-mcp/` directory completely
- ✅ **Size saved**: 49MB → 0MB
- ✅ Contents removed:
  - Old UI-based auth.js (327 lines, 10.4KB)
  - Old MCP server source + compiled
  - Old prompts (7 files)
  - Old config/menu-mapping.json
  - Old README.md
  - Old node_modules (~49MB)

### 3. Updated Configuration Files
- ✅ Updated `.npmignore` - Removed old `.playwright-test-mcp/` references
- ✅ Updated to new structure: `templates/` instead of `.playwright-test-mcp/`

### 4. Created Preview Documentation
- ✅ Created `CHANGELOG.md.v1-preview` - Draft changelog for version 1.0.0
- ✅ Includes BREAKING CHANGES section
- ✅ Includes migration examples
- ✅ Includes full feature list

### 5. Verified No Remaining References
- ✅ Checked codebase for `.playwright-test-mcp` references
- ✅ Checked codebase for `log-in-helper` references
- ✅ Found references only in:
  - Documentation files (OK - historical)
  - .project-memory/tasks/ (OK - tracking)
  - specs/migration.md (OK - old spec for reference)
  - CHANGELOG.md (OK - will update in Phase 6)

---

## 📊 Impact

### Before Cleanup
```
sf360-playwright-mcp/
├── .playwright-test-mcp/ (49MB - LEGACY)
│   ├── log-in-helper/
│   ├── config/
│   ├── prompts/
│   ├── mcp-server/
│   └── node_modules/
├── templates/ (Current structure)
└── ...
Total: ~116MB
```

### After Cleanup
```
sf360-playwright-mcp/
├── templates/
│   ├── helpers/
│   │   ├── auth.js (current, will be replaced)
│   │   ├── auth.js.OLD (backup)
│   │   └── auth.js.OLD.README.txt
│   ├── config/
│   ├── prompts/
│   └── tests/
├── mcp-server/
└── ...
Total: ~67MB (49MB saved!)
```

---

## 📁 Files Created/Modified

### Created:
1. `templates/helpers/auth.js.OLD` - Backup of UI-based auth
2. `templates/helpers/auth.js.OLD.README.txt` - Backup explanation
3. `CHANGELOG.md.v1-preview` - Draft v1.0.0 changelog
4. `.project-memory/tasks/P4-002-completed-summary.md` - This file

### Modified:
1. `.npmignore` - Updated for new structure
2. Filesystem - Removed `.playwright-test-mcp/` directory

### Preserved (Historical):
1. `CHANGELOG.md` - Will be updated in Phase 6 with final v1.0.0 content
2. `specs/migration.md` - Old spec, kept for reference

---

## 🔍 Verification Results

### Directory Removal
```bash
$ ls -la .playwright-test-mcp/
ls: .playwright-test-mcp/: No such file or directory
✅ CONFIRMED: Legacy directory removed
```

### Backup Creation
```bash
$ ls -lh templates/helpers/auth.js.OLD
-rw-r--r-- 1 atran staff 18K Feb 2 12:16 auth.js.OLD
✅ CONFIRMED: Backup created
```

### Size Reduction
```bash
$ du -sh .
67M    .
✅ CONFIRMED: 49MB saved (was ~116MB)
```

### Reference Check
```bash
$ grep -r "\.playwright-test-mcp" --exclude-dir=node_modules \
  --exclude-dir=.git --exclude="*.OLD*" | wc -l
17 references (all in docs/tasks - OK)
✅ CONFIRMED: No problematic references
```

---

## 🎯 Next Steps

### Ready for Phase 1 & 2
With the legacy code removed and old auth backed up, we can now:
1. **Phase 1**: Build new API-based auth system
2. **Phase 2**: Implement setupTest() and fixtures
3. **Phase 4B** (later): Replace auth.js with new implementation

### Auth.js Replacement Plan
When Phase 2 is complete, we'll:
1. Keep `auth.js.OLD` as reference
2. Replace `auth.js` with new API-based orchestrator
3. Import from specialized modules (auth-cognito, auth-sso-login, etc.)
4. Remove old `login()` function completely
5. Export new `setupTest()` as primary function

---

## 📝 Notes

- **Breaking Change**: auth.js.OLD is for reference only - DO NOT USE in new code
- **Version**: This cleanup is part of v1.0.0 (major version bump)
- **Migration**: Users will need to migrate from login() → setupTest()
- **Rollback**: auth.js.OLD preserved if anyone needs to reference old implementation
- **Documentation**: CHANGELOG.md.v1-preview ready for final release

---

## ✅ Acceptance Criteria Met

- [x] .playwright-test-mcp/ directory removed completely (was 49MB with node_modules)
- [x] Current templates/helpers/auth.js backed up to templates/helpers/auth.js.OLD
- [x] No code references .playwright-test-mcp/ or log-in-helper/ paths (except docs)
- [x] Grep verification shows no problematic references
- [x] Backup includes note about UI-based vs API-based differences

---

**Task P4-002: COMPLETE** ✅

*Ready to proceed with Phase 1 (Authentication Foundation)*
