# Verify SF360 Test Setup

You are tasked with verifying and fixing the SF360 Playwright test environment setup.

---

## Objective

Run the automated verification script and fix any issues found. The script checks Node.js version, npm packages, .env configuration, and AWS credentials.

---

## Step 1: Run Verification Script

Run the automated setup verification:

```bash
node sf360-playwright/helpers/verify-setup.js
```

This script checks:

- ✓ Node.js version (>= 18.0.0)
- ✓ Required packages (@aws-sdk/client-ssm, axios, tough-cookie, otplib, jsonwebtoken, dotenv)
- ✓ .env file exists and has valid values (not placeholders)
- ✓ AWS credentials or UI fallback URL

**Read the output carefully** - it will show:

- ✓ Pass: Green checkmarks
- ✗ Fail: Red X with fix instructions
- ⚠ Warn: Yellow warnings with recommendations

---

## Step 2: Fix Issues Based on Script Output

### If Node.js Version Too Old

**Error**: `✗ Node.js: v16.x.x (requires >= 18.0.0)`

**Fix**: Tell user to upgrade Node.js:

```
❌ Node.js version too old (v16.x.x)
Required: >= 18.0.0

Please upgrade Node.js:
  - Download from: https://nodejs.org/
  - Or use nvm: nvm install 20
```

---

### If Packages Missing

**Error**: `✗ otplib: Not installed (Required for: TOTP 2FA generation)`

**Fix**: Install missing packages automatically:

```bash
npm install otplib axios tough-cookie http-cookie-agent jsonwebtoken dotenv @aws-sdk/client-ssm
```

**Then verify again**:

```bash
node sf360-playwright/helpers/verify-setup.js
```

---

### If .env Missing or Invalid

**Error**: `✗ .env file: Not found` or `✗ .env file: Missing required fields`

**Fix Option 1: Use template from sf360-playwright/**

If `sf360-playwright/.env.template` exists:

```bash
cp sf360-playwright/.env.template .env
```

**Fix Option 2: Create from scratch**

```bash
cat > .env << 'EOF'
# SF360 Playwright MCP - Environment Configuration

# ===== Environment Selection =====
ENVIRONMENT=uat

# ===== User Credentials =====
USERNAME=your.email@bglcorp.com.au
USER_PASSWORD=your_password_here
TOTP_SECRET=YOUR_TOTP_SECRET_KEY_HERE

# ===== SF360 Configuration =====
UID=your_user_id
FIRM=sf360test

# ===== Optional: UI-Based Login Fallback =====
# Only needed if you don't have AWS credentials
# 360_UAT_URL=https://sso.uat.bgl360.com.au/login/?app=sf360
EOF
```

**Then inform user to edit .env**:

```
✓ Created .env template

⚠️  ACTION REQUIRED: Edit .env with your credentials:
  1. Open .env in your editor
  2. Replace placeholder values with real credentials
  3. Add TOTP_SECRET from your authenticator app

Required fields:
  - ENVIRONMENT (uat, staging, or production)
  - USERNAME (your BGL email)
  - USER_PASSWORD (your password)
  - TOTP_SECRET (base32 secret from authenticator app)
  - UID (your numeric user ID)
  - FIRM (e.g., sf360test)
```

---

### If AWS Credentials Warning

**Warning**: `⚠ AWS credentials: Not configured. Will use UI-based login fallback.`

**This is OK if**:

- .env has `360_UAT_URL` field
- User is OK with slower UI-based login (10-15s vs 2-3s)

**Recommend API-based auth**:

```
ℹ️  For faster tests (API-based auth):
  1. Get AWS credentials from BGL IT
  2. Follow setup guide: https://bglcorp.atlassian.net/wiki/spaces/DEVOPS/pages/104857700/AWS+Login+via+Jumpcloud
  3. Run: aws configure
  4. Enter AWS Access Key ID and Secret Access Key

API-based auth: 2-3s login
UI-based fallback: 10-15s login
```

---

### If @playwright/test Missing

**Error**: Package not found errors during script run

**Fix**: Install Playwright:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

---

### If sf360-playwright/ Directory Missing

**Error**: Script fails with "Cannot find module './sf360-playwright/helpers/verify-setup.js'"

**Fix**: Initialize the project structure:

```bash
npx sf360-mcp-init
```

This creates:

- `sf360-playwright/prompts/` - MCP tool prompts
- `sf360-playwright/helpers/` - Auth helpers including verify-setup.js
- `sf360-playwright/config/` - menu-mapping.json with 166 pages
- `sf360-playwright/tests/` - Test directory
- `.env` - Environment template
- `playwright.config.js` - Playwright config

---

## Step 3: Verify Again

After fixing issues, run verification again to confirm:

```bash
node sf360-playwright/helpers/verify-setup.js
```

**Expected output when successful**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SF360 Playwright MCP - Setup Verification (v1.0.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Node.js: v18.17.0
✓ @aws-sdk/client-ssm: Installed
✓ axios: Installed
✓ tough-cookie: Installed
✓ http-cookie-agent/http: Installed
✓ otplib: Installed
✓ jsonwebtoken: Installed
✓ dotenv: Installed
✓ .env file: /path/to/project/.env
✓ AWS credentials: Configured (~/.aws/credentials)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All checks passed! Setup is complete.
```

---

## Step 4: Final Status Report

Provide user-friendly summary:

**If all checks passed**:

```markdown
✅ Setup Verified - Ready to Generate Tests!

All dependencies and configuration verified:
✓ Node.js v18+ installed
✓ All required npm packages installed
✓ .env configured with credentials
✓ AWS credentials OR UI fallback configured
✓ SF360 project structure initialized

You can now:

1. Create test plan: Use the 'sf360-test-plan' tool
2. Generate test: Use the 'sf360-test-generate' tool
3. Run & debug: Use the 'sf360-test-evaluate' tool
4. Get report: Use the 'sf360-test-report' tool
5. Discover pages: Use the 'discover-page' tool

Run verification anytime:
node sf360-playwright/helpers/verify-setup.js
```

**If issues remain**:

```markdown
⚠️ Setup Incomplete - Action Required

Issues found:
❌ [Issue 1 from script output]
❌ [Issue 2 from script output]

Please fix the issues above and run verification again:
node sf360-playwright/helpers/verify-setup.js
```
