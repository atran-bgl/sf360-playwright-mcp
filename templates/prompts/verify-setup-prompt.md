# Verify SF360 Test Setup

You are tasked with verifying and fixing the SF360 Playwright test environment setup.

---

## Objective

Check all required dependencies, configuration files, and environment setup. Automatically install missing dependencies and create missing configuration files.

---

## Step-by-Step Verification

### Step 1: Check Node.js Version

```bash
node --version
```

**Required**: Node.js >= 18.0.0

If version is too old, inform user:
```
❌ Node.js version too old
Current: vX.X.X
Required: >= 18.0.0

Please upgrade Node.js:
  - Download from: https://nodejs.org/
  - Or use nvm: nvm install 20
```

### Step 2: Check package.json Exists

```bash
test -f package.json && echo "✓ Found" || echo "✗ Missing"
```

**If missing**:
```
❌ No package.json found

Creating package.json...
```

Run:
```bash
npm init -y
```

### Step 3: Check @playwright/test

```bash
node -e "try { require('@playwright/test'); console.log('✓ @playwright/test installed'); } catch { console.log('✗ @playwright/test missing'); process.exit(1); }"
```

**If missing**:
```
⚠️  @playwright/test not installed (REQUIRED)

Installing @playwright/test...
```

Run:
```bash
npm install --save-dev @playwright/test
```

Verify installation:
```bash
npx playwright --version
```

### Step 4: Check otplib

```bash
node -e "try { require('otplib'); console.log('✓ otplib installed'); } catch { console.log('✗ otplib missing'); process.exit(1); }"
```

**If missing**:
```
⚠️  otplib not installed (RECOMMENDED for automatic 2FA)

Would you like to install otplib? (Recommended)
  - With otplib: Tests run fully automated
  - Without otplib: You must manually enter OTP codes during login

Installing otplib...
```

Run:
```bash
npm install otplib
```

**After installing, verify compatibility**:

Run comprehensive verification:
```bash
node sf360-playwright/helpers/verify-setup.js
```

This checks:
- Node.js version compatibility (>= 18.0.0)
- otplib installation and functionality (tests actual TOTP generation)
- .env file validation
- TOTP_SECRET configuration

**If compatibility issues found**:
```
❌ otplib not working with Node vX.X.X

This can happen with certain otplib versions. Trying stable version 12.0.1...
```

Run:
```bash
npm uninstall otplib
npm install otplib@12.0.1
node sf360-playwright/helpers/verify-setup.js
```

**If still fails after trying 12.0.1**:
```
Skip otplib (manual TOTP entry):
  npm uninstall otplib
  Tests will pause for manual code entry during 2FA
```

**Note**:
- Latest otplib is tried first (best for newer Node versions)
- Falls back to 12.0.1 if compatibility issues detected
- Version 12.0.1 is tested and stable with Node 18/20/22
- otplib is optional but highly recommended for automated testing

### Step 5: Check Playwright Browsers

```bash
npx playwright install --dry-run chromium 2>&1 | grep -q "is already installed" && echo "✓ Browsers installed" || echo "✗ Browsers missing"
```

**If missing**:
```
⚠️  Playwright browsers not installed

Installing Chromium browser...
```

Run:
```bash
npx playwright install chromium
```

**Note**: Only installs Chromium (most commonly used). User can install others if needed:
- `npx playwright install firefox`
- `npx playwright install webkit`

### Step 6: Check .env File Exists

```bash
test -f .env && echo "✓ Found" || echo "✗ Missing"
```

**If missing**:
```
❌ No .env file found in project root

Creating .env template...
```

Create `.env` file:
```bash
cat > .env << 'EOF'
# SF360 Credentials
USERNAME=your.email@bglcorp.com.au
USER_PW=your_password
FIRM=sf360test
360_UAT_URL=https://sso.uat.bgl360.com.au/login/?app=sf360

# Optional: TOTP secret for automatic 2FA
# Get this from your authenticator app during initial setup
TOTP_SECRET=
EOF
```

**Inform user**:
```
✓ Created .env template

⚠️  ACTION REQUIRED: Edit .env file with your credentials:
  1. Open .env in your editor
  2. Replace placeholder values with real credentials
  3. Optionally add TOTP_SECRET for automatic 2FA

Required fields:
  - USERNAME (your SF360 email)
  - USER_PW (your SF360 password)
  - FIRM (e.g., sf360test)
  - 360_UAT_URL (SF360 login URL)
```

### Step 7: Validate .env Contents

If .env exists, read and validate it:

```bash
node -e "
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\\n').forEach(line => {
  const [key, ...val] = line.trim().split('=');
  if (key && !key.startsWith('#')) env[key] = val.join('=');
});
const required = ['USERNAME', 'USER_PW', 'FIRM', '360_UAT_URL'];
const missing = required.filter(f => !env[f] || env[f].trim() === '' || env[f].includes('your_') || env[f].includes('your.'));
if (missing.length > 0) {
  console.log('✗ Missing or incomplete: ' + missing.join(', '));
  process.exit(1);
} else {
  console.log('✓ All required fields present');
}
"
```

**If fields are missing or have placeholder values**:
```
❌ .env file incomplete

Missing or placeholder values:
  - USERNAME (currently: "your.email@bglcorp.com.au")
  - USER_PW (currently: "your_password")

⚠️  ACTION REQUIRED: Edit .env with real credentials
```

**If TOTP_SECRET is empty**:
```
ℹ️  TOTP_SECRET not configured (optional)

Without TOTP_SECRET:
  - You'll need to manually enter OTP codes during test runs
  - Tests will pause and wait for manual input

To enable automatic 2FA:
  1. Get TOTP secret from authenticator app
  2. Add to .env: TOTP_SECRET=your_secret_key
```

### Step 8: Check playwright.config.js

```bash
test -f playwright.config.js && echo "✓ Found" || echo "✗ Missing"
```

**If missing**:
```
⚠️  No playwright.config.js found

Creating basic playwright.config.js...
```

Create file:
```javascript
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

### Step 9: Check Directory Structure

```bash
test -d sf360-playwright && echo "✓ sf360-playwright/ exists" || echo "✗ sf360-playwright/ missing"
```

**If sf360-playwright/ missing**:
```
❌ sf360-playwright/ directory not found

This directory should have been created by 'npx sf360-mcp-init'.

Run:
  npx sf360-mcp-init

This will create:
  - sf360-playwright/prompts/     (test generation prompts)
  - sf360-playwright/helpers/     (auth.js login helper)
  - sf360-playwright/config/      (menu-mapping.json)
  - sf360-playwright/tests/       (your tests go here)
```

**If exists, check subdirectories**:
```bash
test -d sf360-playwright/prompts && echo "✓ prompts/" || echo "✗ Missing prompts/"
test -d sf360-playwright/helpers && echo "✓ helpers/" || echo "✗ Missing helpers/"
test -d sf360-playwright/config && echo "✓ config/" || echo "✗ Missing config/"
test -d sf360-playwright/tests && echo "✓ tests/" || echo "✗ Missing tests/"
```

### Step 10: Verify Auth Helper

```bash
node -e "
try {
  const auth = require('./sf360-playwright/helpers/auth');
  const exports = Object.keys(auth);
  console.log('✓ Auth helper loaded');
  console.log('  Exports:', exports.join(', '));
} catch (error) {
  console.log('✗ Auth helper error:', error.message);
  process.exit(1);
}
"
```

**If fails**:
```
❌ Cannot load auth helper

Check that sf360-playwright/helpers/auth.js exists.
If missing, run: npx sf360-mcp-init
```

### Step 11: Verify Menu Mapping

```bash
node -e "
try {
  const mapping = require('./sf360-playwright/config/menu-mapping.json');
  const sections = Object.keys(mapping).length;
  console.log('✓ Menu mapping loaded');
  console.log('  Sections:', sections);
} catch (error) {
  console.log('✗ Menu mapping error:', error.message);
  process.exit(1);
}
"
```

---

## Final Status Report

After all checks, provide a summary:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SF360 PLAYWRIGHT SETUP VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## System Requirements
✓ Node.js v18.0.0 or higher (vX.X.X detected)
✓ npm available

## Dependencies
✓ @playwright/test installed (vX.X.X)
✓ otplib installed (vX.X.X)
✓ Playwright Chromium browser installed

## Configuration
✓ .env file exists
✓ .env has all required fields
⚠️ TOTP_SECRET not configured (manual OTP required)
✓ playwright.config.js exists

## Project Structure
✓ sf360-playwright/ directory exists
✓ sf360-playwright/prompts/ exists
✓ sf360-playwright/helpers/ exists
✓ sf360-playwright/config/ exists
✓ sf360-playwright/tests/ exists
✓ Auth helper loads correctly
✓ Menu mapping loads correctly (8 sections, 37 pages)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SETUP STATUS: READY ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can now:
  1. Generate tests: Use the 'generate-test' tool
  2. Discover pages: Use the 'discover-page' tool
  3. Run tests: npm test

Optional improvements:
  - Add TOTP_SECRET to .env for automatic 2FA

Run verification anytime:
  node sf360-playwright/helpers/verify-setup.js
```

**If there are issues**:
```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SETUP STATUS: ISSUES FOUND ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues that need attention:
  ❌ .env credentials are placeholders
  ❌ Playwright browsers not installed

Action required:
  1. Edit .env with real SF360 credentials
  2. Run: npx playwright install chromium

Run 'verify-setup' again after fixing these issues.
```

---

## Auto-Fix Behavior

This tool automatically fixes common issues:

| Issue | Auto-Fix Action |
|-------|-----------------|
| Missing package.json | Creates with `npm init -y` |
| Missing @playwright/test | Runs `npm install --save-dev @playwright/test` |
| Missing otplib | Asks user, then runs `npm install otplib` |
| Missing browsers | Runs `npx playwright install chromium` |
| Missing .env | Creates template with placeholders |
| Missing playwright.config.js | Creates basic config |
| Missing tests/ directory | Creates directory |

**Does NOT auto-fix**:
- Low Node.js version (user must upgrade)
- Placeholder values in .env (user must edit manually)
- Missing sf360-playwright/ (user must run 'npx sf360-mcp-init')

---

## Usage Notes

**When to run**:
- First time setting up the project
- After cloning the project on a new machine
- When dependencies seem broken
- Before generating tests

**How to invoke**:
```
Verify my SF360 test setup
```

or

```
Check if everything is installed for SF360 testing
```

---

## Troubleshooting

### npm install fails

If `npm install` fails:
1. Check network connection
2. Try: `npm cache clean --force`
3. Delete `node_modules/` and `package-lock.json`
4. Run: `npm install` again

### Permission errors

If permission denied:
- Don't use `sudo npm install`
- Fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

### Playwright install fails

If browser installation fails:
- Check disk space
- Check network connection
- Try manually: `npx playwright install chromium --force`

### otplib compatibility issues

If otplib is installed but not working:

**Check with verify script**:
```bash
node sf360-playwright/helpers/verify-setup.js
```

This tests actual TOTP generation and detects compatibility issues.

**Common issues**:

1. **Incompatible otplib version with current Node**
   - Some otplib versions don't work with certain Node versions
   - Latest otplib works best with Node 22+
   - Version 12.0.1 is stable with Node 18/20/22
   - Solution: Try 12.0.1
     ```bash
     npm uninstall otplib && npm install otplib@12.0.1
     node sf360-playwright/helpers/verify-setup.js
     ```

2. **otplib generates invalid codes**
   - May indicate version compatibility issue
   - Solution: Use stable version 12.0.1 (see above)

3. **Import/require errors**
   - Module system mismatch
   - Solution: Ensure project is using CommonJS (check package.json doesn't have "type": "module")

**Strategy**:
- Setup tries latest otplib first (best for newer Node)
- Falls back to 12.0.1 if compatibility issues detected
- This ensures compatibility across Node 18/20/22/24+

**Workarounds if otplib can't be fixed**:
- Remove otplib: `npm uninstall otplib`
- Tests will work but pause for manual TOTP entry
- Run tests in headed mode: `npx playwright test --headed`
- Enter code manually when prompted during 2FA step
- Tests are designed to handle both automated and manual TOTP entry

---

## Customization Notes

This prompt can be edited to:
- Add checks for additional dependencies
- Change browser installation (firefox, webkit)
- Modify .env template
- Add custom validation rules

Edit this file at: `sf360-playwright/prompts/verify-setup-prompt.md`
