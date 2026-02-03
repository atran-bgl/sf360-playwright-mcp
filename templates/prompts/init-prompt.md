# Initialize SF360 Playwright Test Infrastructure

Interactive setup wizard for SF360 Playwright testing.

---

## Overview

1. Create project structure (sf360-playwright/ folder)
2. Create .env template file
3. Ask user to edit .env with credentials
4. Install dependencies (@playwright/test, otplib)
5. Install Playwright browsers
6. Add Playwright MCP
7. Verify setup

---

## Step 1: Create Project Structure

Run initialization:
```bash
npx sf360-mcp-init
```

Creates:
- `sf360-playwright/prompts/`, `helpers/`, `config/`, `tests/`
- `.env` template
- `playwright.config.js` (if missing)

---

## Step 2: Create .env Template

Check if exists:
```bash
test -f .env && echo "exists" || echo "not found"
```

**If exists**: Skip to Step 3

**If not found**, create template:
```bash
cat > .env << 'EOF'
# SF360 Credentials
USERNAME=your.email@bglcorp.com.au
USER_PW=your_password
FIRM=sf360test
360_UAT_URL=https://sso.uat.bgl360.com.au/login/?app=sf360

# Optional: TOTP secret for automatic 2FA
TOTP_SECRET=
EOF
```

Add to .gitignore:
```bash
grep -q "^\.env$" .gitignore 2>/dev/null || echo ".env" >> .gitignore
```

Inform user:
```
✓ Created .env template
✓ Added .env to .gitignore

ACTION REQUIRED: Edit .env with your SF360 credentials

Required fields:
  USERNAME, USER_PW, FIRM, 360_UAT_URL

Optional field:
  TOTP_SECRET (for automatic 2FA)
```

---

## Step 3: Confirm User Edited .env

Use AskUserQuestion:
- Question: "Have you finished editing the .env file with your SF360 credentials?"
- Options: "Yes, I've updated .env" / "No, I need more time"

**If "No"**: Wait for user, then ask again

**If "Yes"**: Validate .env:

```bash
node -e "
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...val] = trimmed.split('=');
    if (key) env[key.trim()] = val.join('=').trim();
  }
});

const required = ['USERNAME', 'USER_PW', 'FIRM', '360_UAT_URL'];
const placeholders = ['your.email@bglcorp.com.au', 'your_password'];
const missing = required.filter(f => {
  const val = env[f];
  return !val || val === '' || placeholders.some(p => val.includes(p));
});

if (missing.length > 0) {
  console.log('MISSING:' + missing.join(','));
  process.exit(1);
} else {
  console.log('OK');
}
"
```

**If fails**: Ask user to edit again, repeat Step 3
**If succeeds**: Proceed to Step 4

---

## Step 4: Install Dependencies

### 4.1: Check/Create package.json

```bash
test -f package.json && echo "exists" || npm init -y
```

### 4.2: Install @playwright/test

Check if installed:
```bash
node -e "try { require('@playwright/test'); console.log('installed'); } catch { process.exit(1); }"
```

If not installed:
```bash
npm install --save-dev @playwright/test
```

### 4.3: Install otplib (Optional)

**Decision Flow:**
```
Check TOTP_SECRET in .env → NO_SECRET → Skip
                           ↓ HAS_SECRET
                      Install otplib
                           ↓
                   Run verify-setup.js
                           ↓
              ✓ Compatible → Done
              ✗ Not working → Try v12.0.1
                           ↓
                   Run verify-setup.js
                           ↓
              ✓ Compatible → Done
              ✗ Still failing → Uninstall
```

Check for TOTP_SECRET:
```bash
grep -q "^TOTP_SECRET=.\+" .env && echo "HAS_SECRET" || echo "NO_SECRET"
```

**If NO_SECRET**: Skip otplib, inform user manual OTP required

**If HAS_SECRET**:

Check if installed:
```bash
node -e "try { require('otplib'); console.log('installed'); } catch { process.exit(1); }"
```

If not installed:
```bash
npm install otplib
```

**Verify compatibility**:
```bash
node sf360-playwright/helpers/verify-setup.js
```

Read output and look for:
- `✓ otplib: Installed and compatible` → SUCCESS, proceed to Step 5
- `✗ otplib: Not working with Node` → FAILURE, try v12.0.1 below

**If FAILURE**, try v12.0.1:
```bash
npm uninstall otplib && npm install otplib@12.0.1
node sf360-playwright/helpers/verify-setup.js
```

Check output again:
- `✓ otplib: Installed and compatible` → SUCCESS, proceed to Step 5
- `✗ otplib: Not working` → Uninstall below

**If still fails**, uninstall:
```bash
npm uninstall otplib
```

Inform user:
```
⚠️ otplib incompatible - using manual TOTP entry
Tests will pause for manual code entry during login.
```

---

## Step 5: Install Playwright Browsers

Check if installed:
```bash
npx playwright install --dry-run chromium 2>&1 | grep -q "is already installed"
```

If not installed:
```bash
npx playwright install chromium
```

---

## Step 6: Add Playwright MCP

Check if already installed:
```bash
grep -r "playwright" ~/.claude.json .claude.json 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
```

**If FOUND**: Skip to Step 7

**If NOT_FOUND**: Install:
```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

**If fails**: Inform user to add manually

---

## Step 7: Verify Setup

Call the verify-setup tool to confirm installation.

---

## Final Summary

**Check if Playwright MCP was installed in Step 6**

**If Playwright MCP was installed**, show RESTART warning first:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  ACTION REQUIRED: RESTART CLAUDE NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Playwright MCP was added during setup.

You MUST restart Claude before using test generation:
  1. Exit this Claude session
  2. Start a new session
  3. Verify with: /mcp

MCP servers only load at startup.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then show completion:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SF360 PLAYWRIGHT INITIALIZATION COMPLETE! ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Project structure created
✓ Credentials configured (.env)
✓ Dependencies installed
✓ Playwright browsers installed
✓ Playwright MCP added
✓ Setup verified

NEXT STEPS (After restarting Claude):
  1. Generate test: "Generate a test for Badge settings"
  2. Discover page: "Discover Badge settings page"
  3. Run tests: npx playwright test

Customize:
  - Prompts: sf360-playwright/prompts/
  - Login: sf360-playwright/helpers/auth.js
  - Pages: sf360-playwright/config/menu-mapping.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Error Handling

### npx sf360-mcp-init fails
Check package installed:
```bash
npm list @bgl/sf360-playwright-mcp
```
If missing, install package first.

### npm install fails
```bash
npm cache clean --force
npm install
```

### claude mcp add fails
Inform user:
```
⚠️ Could not add Playwright MCP automatically
Add manually: claude mcp add playwright -- npx -y @playwright/mcp@latest
```

### .env validation fails
Ask user to edit .env again, re-validate.

---

## Important Notes

1. .env automatically added to .gitignore
2. Users edit .env directly (no credentials in chat)
3. otplib is optional - tests work with manual TOTP entry
4. Restart Claude required after adding Playwright MCP
5. Only Chromium installed by default

---

**Remember**: This is an action-focused wizard. Use AskUserQuestion only for .env confirmation. Provide clear status after each step. Handle errors with specific fix commands.
