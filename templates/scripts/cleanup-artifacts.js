#!/usr/bin/env node

/**
 * SF360 Test Artifact Cleanup Script
 *
 * Cleans up old screenshots and reports from test directory.
 * Plans are NEVER deleted automatically (small size, useful for regeneration).
 *
 * Usage:
 *   node scripts/cleanup-artifacts.js [options]
 *   npm run cleanup-artifacts -- [options]
 *
 * Options:
 *   --dry-run            Show what would be deleted without actually deleting
 *   --screenshots=DAYS   Delete screenshots older than X days (default: 30)
 *   --reports=DAYS       Delete reports older than X days (default: 90)
 *   --plans=DAYS         Delete plans older than X days (default: never, use 0 to delete all)
 *   --help               Show this help message
 *
 * Examples:
 *   node scripts/cleanup-artifacts.js --dry-run
 *   node scripts/cleanup-artifacts.js --screenshots=7
 *   node scripts/cleanup-artifacts.js --screenshots=7 --reports=30
 */

const fs = require('fs');
const path = require('path');

// Default configuration
const DEFAULT_SCREENSHOT_AGE = 30; // days
const DEFAULT_REPORT_AGE = 90;     // days
const DEFAULT_PLAN_AGE = null;     // never delete by default

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    dryRun: false,
    screenshotAge: DEFAULT_SCREENSHOT_AGE,
    reportAge: DEFAULT_REPORT_AGE,
    planAge: DEFAULT_PLAN_AGE,
    help: false
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg.startsWith('--screenshots=')) {
      config.screenshotAge = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--reports=')) {
      config.reportAge = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--plans=')) {
      config.planAge = parseInt(arg.split('=')[1], 10);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  return config;
}

// Show help message
function showHelp() {
  console.log(`
SF360 Test Artifact Cleanup Script

Cleans up old screenshots and reports from test directory.
Plans are NEVER deleted automatically by default.

Usage:
  node scripts/cleanup-artifacts.js [options]
  npm run cleanup-artifacts -- [options]

Options:
  --dry-run            Show what would be deleted without actually deleting
  --screenshots=DAYS   Delete screenshots older than X days (default: ${DEFAULT_SCREENSHOT_AGE})
  --reports=DAYS       Delete reports older than X days (default: ${DEFAULT_REPORT_AGE})
  --plans=DAYS         Delete plans older than X days (default: never)
  --help               Show this help message

Examples:
  # Preview what would be deleted
  node scripts/cleanup-artifacts.js --dry-run

  # Delete screenshots older than 7 days
  node scripts/cleanup-artifacts.js --screenshots=7

  # Delete screenshots (7 days) and reports (30 days)
  node scripts/cleanup-artifacts.js --screenshots=7 --reports=30

  # Delete all plans (use with caution!)
  node scripts/cleanup-artifacts.js --plans=0

Notes:
  - Plans are kept indefinitely by default (useful for test regeneration)
  - Screenshots can accumulate quickly (200-500 KB each)
  - Reports are useful for history but can be regenerated
  - Use --dry-run first to see what would be deleted
  `);
}

// Get file age in days
function getFileAgeDays(filePath) {
  const stats = fs.statSync(filePath);
  const now = Date.now();
  const fileTime = stats.mtimeMs;
  const ageDays = (now - fileTime) / (1000 * 60 * 60 * 24);
  return ageDays;
}

// Get human-readable size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Clean artifacts in a directory
function cleanArtifacts(dir, pattern, maxAgeDays, artifactType, dryRun) {
  if (!fs.existsSync(dir)) {
    console.log(`ℹ ${artifactType} directory not found: ${dir}`);
    return { deleted: 0, savedSpace: 0 };
  }

  const files = fs.readdirSync(dir);
  let deleted = 0;
  let savedSpace = 0;

  const matchingFiles = files.filter(f => f.match(pattern));

  if (matchingFiles.length === 0) {
    console.log(`ℹ No ${artifactType} files found in ${dir}`);
    return { deleted, savedSpace };
  }

  console.log(`\n📁 Checking ${matchingFiles.length} ${artifactType} file(s) in ${dir}...`);

  for (const file of matchingFiles) {
    const filePath = path.join(dir, file);
    const ageDays = getFileAgeDays(filePath);
    const size = fs.statSync(filePath).size;

    if (maxAgeDays !== null && ageDays > maxAgeDays) {
      if (dryRun) {
        console.log(`  [DRY RUN] Would delete: ${file} (${ageDays.toFixed(1)} days old, ${formatSize(size)})`);
      } else {
        try {
          fs.unlinkSync(filePath);
          console.log(`  ✓ Deleted: ${file} (${ageDays.toFixed(1)} days old, ${formatSize(size)})`);
          deleted++;
          savedSpace += size;
        } catch (err) {
          console.error(`  ✗ Failed to delete ${file}: ${err.message}`);
        }
      }
    }
  }

  if (deleted === 0 && !dryRun) {
    console.log(`  ℹ No ${artifactType} files older than ${maxAgeDays} days`);
  }

  return { deleted, savedSpace };
}

// Main function
function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    return;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SF360 Test Artifact Cleanup');
  console.log('═══════════════════════════════════════════════════════════════');

  if (config.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No files will be deleted\n');
  }

  console.log('\n Configuration:');
  console.log(`  Screenshots: Delete if older than ${config.screenshotAge} days`);
  console.log(`  Reports:     Delete if older than ${config.reportAge} days`);
  console.log(`  Plans:       ${config.planAge !== null ? `Delete if older than ${config.planAge} days` : 'Never delete (default)'}`);

  const testsDir = path.join(process.cwd(), 'tests');

  if (!fs.existsSync(testsDir)) {
    console.error('\n✗ Error: tests/ directory not found');
    console.error('  Run this script from the project root directory');
    process.exit(1);
  }

  const results = {
    screenshots: { deleted: 0, savedSpace: 0 },
    reports: { deleted: 0, savedSpace: 0 },
    plans: { deleted: 0, savedSpace: 0 }
  };

  // Clean screenshots
  results.screenshots = cleanArtifacts(
    path.join(testsDir, 'screenshots'),
    /\.(png|jpg|jpeg)$/i,
    config.screenshotAge,
    'screenshot',
    config.dryRun
  );

  // Clean reports
  results.reports = cleanArtifacts(
    path.join(testsDir, 'reports'),
    /\-report\.md$/i,
    config.reportAge,
    'report',
    config.dryRun
  );

  // Clean plans (only if explicitly configured)
  if (config.planAge !== null) {
    results.plans = cleanArtifacts(
      path.join(testsDir, 'plans'),
      /\-plan\.json$/i,
      config.planAge,
      'plan',
      config.dryRun
    );
  } else {
    console.log('\nℹ Plans: Skipped (never delete by default)');
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const totalDeleted = results.screenshots.deleted + results.reports.deleted + results.plans.deleted;
  const totalSaved = results.screenshots.savedSpace + results.reports.savedSpace + results.plans.savedSpace;

  if (config.dryRun) {
    console.log(`  Would delete ${totalDeleted} file(s)`);
    console.log(`  Would save ${formatSize(totalSaved)}`);
  } else {
    console.log(`  Deleted ${totalDeleted} file(s)`);
    console.log(`  Saved ${formatSize(totalSaved)}`);
  }

  console.log(`\n  Screenshots: ${results.screenshots.deleted} deleted (${formatSize(results.screenshots.savedSpace)})`);
  console.log(`  Reports:     ${results.reports.deleted} deleted (${formatSize(results.reports.savedSpace)})`);
  console.log(`  Plans:       ${results.plans.deleted} deleted (${formatSize(results.plans.savedSpace)})`);

  console.log('\n═══════════════════════════════════════════════════════════════\n');

  if (config.dryRun) {
    console.log('ℹ This was a dry run. Run without --dry-run to actually delete files.');
  } else {
    console.log('✓ Cleanup complete!');
  }
}

// Run
try {
  main();
} catch (err) {
  console.error('\n✗ Error:', err.message);
  process.exit(1);
}
