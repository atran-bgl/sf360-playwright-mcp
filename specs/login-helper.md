# Phase 2: Login Helper Enhancements

## Objective
Enhance `auth.js` to work reliably in consuming projects with robust .env validation and clear error messages.

---

## Current Issues to Fix

1. **Weak validation**: Only checks USERNAME/USER_PW after loading
2. **Hardcoded paths**: Specific to original dev environment (`superstream_dashboard/.env`)
3. **No .env check**: Doesn't verify file exists before attempting load
4. **Generic errors**: Not helpful for consuming projects

---

## Key Changes Required

### 1. .env Search Path Update (Lines 76-82)

**Remove**:
```javascript
path.join(__dirname, '..', '..', '..', 'superstream_dashboard', '.env'),
```

**Replace with**:
```javascript
const possiblePaths = [
  path.join(currentDir, '.env'),           // Consuming project root (PRIORITY)
  path.join(currentDir, '..', '.env'),     // Parent
  path.join(currentDir, '../..', '.env'),  // Grandparent
  path.join(__dirname, '../..', '.env'),   // Package root
];
```

### 2. Add Pre-Flight Validation Functions

Insert before `login()`:

```javascript
function checkEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return { exists: false, error: `.env not found: ${envPath}` };
  }
  try {
    fs.accessSync(envPath, fs.constants.R_OK);
    return { exists: true, error: null };
  } catch {
    return { exists: false, error: `.env not readable: ${envPath}` };
  }
}

function validateEnvFields(env, envPath) {
  const required = ['USERNAME', 'USER_PW', 'FIRM', '360_UAT_URL'];
  const missing = required.filter(f => !env[f] || !env[f].trim());
  return { valid: missing.length === 0, missing, envPath };
}
```

### 3. Enhanced Error Messages

Replace lines 91-93 (env not found error):

```javascript
throw new Error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  .env FILE NOT FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Searched:
${possiblePaths.map(p => `  - ${p}`).join('\n')}

Setup: Create .env in project root with:
  USERNAME=your.email@bglcorp.com.au
  USER_PW=your_password
  FIRM=sf360test
  360_UAT_URL=https://sso.uat.bgl360.com.au/login/?app=sf360
  TOTP_SECRET=optional_totp_secret

See .playwright-test-mcp/README.md for details.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
```

Replace lines 106-108 (missing credentials error):

```javascript
const validation = validateEnvFields(env, envPath);
if (!validation.valid) {
  throw new Error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MISSING REQUIRED FIELDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: ${envPath}
Missing: ${validation.missing.join(', ')}

Required fields:
  - USERNAME     (SF360 login email)
  - USER_PW      (password)
  - FIRM         (e.g., sf360test)
  - 360_UAT_URL  (UAT environment URL)
  - TOTP_SECRET  (optional - for 2FA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}
```

### 4. Add Verbose Logging Option

Add to `login()` options parameter:
```javascript
async function login(page, options = {}) {
  const verbose = options.verbose || false;

  if (verbose) {
    console.log('━━━ SF360 Login Helper ━━━');
    console.log(`CWD: ${process.cwd()}`);
    console.log(`Helper: ${__dirname}`);
  }
  // ... rest of function
}
```

### 5. Update Exports

Add to module.exports:
```javascript
module.exports = {
  login,
  navigateToPage,
  generateTOTP,
  loadEnvFile,
  validateEnvFile: validateEnvFields,  // NEW
  checkEnvExists: checkEnvFile          // NEW
};
```

---

## Refactored Code Structure

Organize auth.js into sections:

```javascript
// ===== SECTION 1: ENV FILE HANDLING =====
function checkEnvFile(envPath) { ... }
function loadEnvFile(envPath) { ... }
function validateEnvFields(env, envPath) { ... }

// ===== SECTION 2: TOTP / 2FA =====
let authenticator = null;
function loadOTPLib() { ... }
function generateTOTP(secret) { ... }

// ===== SECTION 3: LOGIN FLOW =====
async function login(page, options = {}) { ... }

// ===== SECTION 4: NAVIGATION =====
async function navigateToPage(page, pageKey, options = {}) { ... }

// ===== EXPORTS =====
module.exports = { ... };
```

---

## Testing Checklist

- [ ] Missing .env shows clear error with setup instructions
- [ ] Incomplete .env lists missing fields
- [ ] Valid .env in project root is auto-detected
- [ ] Explicit envPath option still works
- [ ] Verbose mode logs helpful debug info
- [ ] Existing tests pass with updated paths

---

## Files Modified

- `.playwright-test-mcp/log-in-helper/auth.js`

---

## Dependencies

**Requires**: Phase 1 complete (file migration)
**Enables**: Phase 3-4 (MCP server, prompts)
