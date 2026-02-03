/**
 * SF360 Playwright MCP - Setup Verification
 * Verifies all dependencies and configuration are correct
 */

const fs = require('fs');
const path = require('path');

/**
 * Verify setup is correct
 * @param {Object} options - Verification options
 * @param {boolean} [options.verbose=true] - Show detailed output
 * @returns {Object} Verification results
 */
function verifySetup(options = {}) {
  const { verbose = true } = options;

  const results = {
    success: true,
    checks: [],
    warnings: [],
    errors: []
  };

  if (verbose) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SF360 Playwright MCP - Setup Verification (v1.0.0)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

  if (majorVersion >= 18) {
    results.checks.push({
      name: 'Node.js version',
      status: 'pass',
      message: nodeVersion
    });
    if (verbose) console.log(`✓ Node.js: ${nodeVersion}`);
  } else {
    results.success = false;
    results.errors.push({
      name: 'Node.js version',
      status: 'fail',
      message: `${nodeVersion} (requires >= 18.0.0)`,
      fix: 'Upgrade Node.js to version 18 or higher'
    });
    if (verbose) {
      console.log(`✗ Node.js: ${nodeVersion}`);
      console.log('  Requires: >= 18.0.0');
      console.log('  Fix: Upgrade Node.js\n');
    }
  }

  // Check required packages
  const requiredPackages = [
    { name: '@aws-sdk/client-ssm', reason: 'AWS Parameter Store configuration' },
    { name: 'axios', reason: 'HTTP requests' },
    { name: 'tough-cookie', reason: 'Cookie management' },
    { name: 'http-cookie-agent/http', reason: 'Axios cookie support' },
    { name: 'otplib', reason: 'TOTP 2FA generation' },
    { name: 'jsonwebtoken', reason: 'JWT token validation' },
    { name: 'dotenv', reason: 'Environment variable loading' }
  ];

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg.name);
      results.checks.push({
        name: pkg.name,
        status: 'pass',
        message: 'Installed'
      });
      if (verbose) console.log(`✓ ${pkg.name}: Installed`);
    } catch (error) {
      results.success = false;
      results.errors.push({
        name: pkg.name,
        status: 'fail',
        message: `Not installed (${pkg.reason})`,
        fix: `npm install ${pkg.name}`
      });
      if (verbose) {
        console.log(`✗ ${pkg.name}: Not installed`);
        console.log(`  Required for: ${pkg.reason}`);
        console.log(`  Fix: npm install ${pkg.name}\n`);
      }
    }
  }

  // Check .env file
  const currentDir = process.cwd();
  const possiblePaths = [
    path.join(currentDir, '.env'),
    path.join(currentDir, '..', '.env'),
    path.join(currentDir, '../..', '.env')
  ];

  let envPath = null;
  let envVars = {}; // Declare at function level for wider scope

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      envPath = p;
      break;
    }
  }

  if (envPath) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([A-Z_0-9]+)=(.*)$/); // Also match digits for 360_UAT_URL
      if (match) {
        envVars[match[1]] = match[2];
      }
    });

    // Check required fields
    const requiredFields = [
      { name: 'ENVIRONMENT', example: 'uat' },
      { name: 'USERNAME', example: 'your.email@bglcorp.com.au' },
      { name: 'USER_PASSWORD', example: 'your_password' },
      { name: 'TOTP_SECRET', example: 'YOUR_TOTP_SECRET' },
      { name: 'UID', example: '1234' },
      { name: 'FIRM', example: 'sf360test' }
    ];

    const missingFields = [];
    for (const field of requiredFields) {
      if (!envVars[field.name] || envVars[field.name].trim() === '' || envVars[field.name].includes('your_') || envVars[field.name].includes('YOUR_')) {
        missingFields.push(field);
      }
    }

    if (missingFields.length === 0) {
      results.checks.push({
        name: '.env file',
        status: 'pass',
        message: `Found at ${envPath}`
      });
      if (verbose) console.log(`✓ .env file: ${envPath}`);
    } else {
      results.success = false;
      results.errors.push({
        name: '.env file',
        status: 'fail',
        message: `Missing or placeholder values: ${missingFields.map(f => f.name).join(', ')}`,
        fix: `Update ${envPath} with real values`
      });
      if (verbose) {
        console.log(`✗ .env file: Missing required fields`);
        console.log(`  Missing: ${missingFields.map(f => f.name).join(', ')}`);
        console.log(`  Fix: Add real values to ${envPath}\n`);
      }
    }

    // Check for deprecated fields (old v0.2.x format)
    const deprecatedFields = ['COGNITO_URL', 'COGNITO_CLIENT_ID', 'SSO_URL', 'SF360_SERVER_URL'];
    const foundDeprecated = deprecatedFields.filter(f => envVars[f]);

    if (foundDeprecated.length > 0) {
      results.warnings.push({
        name: '.env format',
        status: 'warn',
        message: `Deprecated fields found: ${foundDeprecated.join(', ')}. These are fetched from AWS Parameter Store in v1.0.0.`,
        fix: 'Remove deprecated fields - they are no longer used'
      });
      if (verbose) {
        console.log(`⚠ .env: Contains deprecated fields (v0.2.x format)`);
        console.log(`  Deprecated: ${foundDeprecated.join(', ')}`);
        console.log(`  v1.0.0 fetches these from AWS Parameter Store\n`);
      }
    }
  } else {
    results.success = false;
    results.errors.push({
      name: '.env file',
      status: 'fail',
      message: 'Not found',
      fix: 'Create .env in project root with ENVIRONMENT, USERNAME, USER_PASSWORD, TOTP_SECRET, UID, FIRM'
    });
    if (verbose) {
      console.log('✗ .env file: Not found');
      console.log('  Fix: Create .env in project root');
      console.log('  Required: ENVIRONMENT, USERNAME, USER_PASSWORD, TOTP_SECRET, UID, FIRM\n');
    }
  }

  // Check AWS credentials
  const awsConfigPath = path.join(require('os').homedir(), '.aws', 'credentials');
  const hasAWS = fs.existsSync(awsConfigPath);
  const hasFallbackURL = envVars['360_UAT_URL'] && envVars['360_UAT_URL'].trim() !== '';

  if (hasAWS) {
    results.checks.push({
      name: 'AWS credentials',
      status: 'pass',
      message: 'Configured (API-based auth)'
    });
    if (verbose) console.log('✓ AWS credentials: Configured (~/.aws/credentials)');
  } else if (hasFallbackURL) {
    results.warnings.push({
      name: 'AWS credentials',
      status: 'warn',
      message: 'Not configured. Will use UI-based login fallback (360_UAT_URL).',
      fix: 'For faster tests (API-based): Run `aws configure`'
    });
    if (verbose) {
      console.log('⚠ AWS credentials: Not configured');
      console.log('  Fallback: UI-based login (360_UAT_URL)');
      console.log('  Note: UI-based login is slower (10-15s vs 2-3s)');
      console.log('  For faster tests: Run `aws configure` with BGL AWS credentials\n');
    }
  } else {
    results.warnings.push({
      name: 'AWS credentials',
      status: 'warn',
      message: 'Not configured and no 360_UAT_URL fallback. Authentication will fail.',
      fix: 'Either: 1) Run `aws configure` OR 2) Add 360_UAT_URL to .env'
    });
    if (verbose) {
      console.log('⚠ AWS credentials: Not configured');
      console.log('  No fallback URL (360_UAT_URL) found in .env');
      console.log('  Fix: Either:');
      console.log('    1) Run `aws configure` with BGL AWS credentials (recommended)');
      console.log('    2) Add 360_UAT_URL to .env for UI-based login\n');
    }
  }

  // Summary
  if (verbose) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (results.success && results.warnings.length === 0) {
      console.log('✅ All checks passed! Setup is complete.\n');
    } else if (results.success && results.warnings.length > 0) {
      console.log(`✅ Setup complete with ${results.warnings.length} warning(s).\n`);
    } else {
      console.log(`❌ Setup incomplete. ${results.errors.length} error(s) found.\n`);
      console.log('Fix the errors above and run verification again.\n');
    }
  }

  return results;
}

module.exports = { verifySetup };

// CLI usage
if (require.main === module) {
  const results = verifySetup({ verbose: true });
  process.exit(results.success ? 0 : 1);
}
