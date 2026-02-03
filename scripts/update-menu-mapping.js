#!/usr/bin/env node

/**
 * Update menu-mapping.json with requiresFund and requiresMember properties
 * Run: node scripts/update-menu-mapping.js
 */

const fs = require('fs');
const path = require('path');

const menuMappingPath = path.join(__dirname, '../config/menu-mapping.json');

// Read current menu mapping
const menuMapping = JSON.parse(fs.readFileSync(menuMappingPath, 'utf8'));

/**
 * Recursively add properties to all page entries
 */
function addPropertiesToPages(obj, parentKey = '') {
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      // Check if this is a page entry (has 'name' and 'url' properties)
      if (value.name && value.url) {
        // Add properties if they don't exist
        if (!value.hasOwnProperty('requiresFund')) {
          value.requiresFund = false; // Default to false for existing (firm-level) pages
        }
        if (!value.hasOwnProperty('requiresMember')) {
          value.requiresMember = false; // Default to false
        }

        console.log(`✓ Updated: ${parentKey}.${key} - requiresFund: ${value.requiresFund}, requiresMember: ${value.requiresMember}`);
      } else {
        // Recursively process nested objects
        addPropertiesToPages(value, parentKey ? `${parentKey}.${key}` : key);
      }
    }
  }
}

// Add fund-level pages template (to be populated after discovery with fund context)
menuMapping.fund = {
  _comment: "Fund-level pages - requires fund selection. To discover: Run discovery test WITH fund created.",
  members: {
    name: "Members",
    url: "/s/members/",
    section: "FUND",
    requiresFund: true,
    requiresMember: false
  },
  member_details: {
    name: "Member Details",
    url: "/s/member/details/",
    section: "FUND",
    requiresFund: true,
    requiresMember: true
  },
  transactions: {
    name: "Transactions",
    url: "/s/transactions/",
    section: "FUND",
    requiresFund: true,
    requiresMember: false
  },
  banking: {
    name: "Banking",
    url: "/s/banking/",
    section: "FUND",
    requiresFund: true,
    requiresMember: false
  },
  investments: {
    name: "Investments",
    url: "/s/investments/",
    section: "FUND",
    requiresFund: true,
    requiresMember: false
  },
  fund_reports: {
    name: "Fund Reports",
    url: "/s/fund-reports/",
    section: "FUND",
    requiresFund: true,
    requiresMember: false
  }
};

console.log('\n━━━ Updating menu-mapping.json ━━━\n');

// Process existing pages
addPropertiesToPages(menuMapping);

console.log('\n✓ Added fund-level pages template');

// Write updated mapping back to file
fs.writeFileSync(menuMappingPath, JSON.stringify(menuMapping, null, 2) + '\n');

console.log(`\n✅ Updated: ${menuMappingPath}`);
console.log('\n📝 Summary:');
console.log('- All existing pages: requiresFund: false, requiresMember: false');
console.log('- Added fund section with common fund-level pages');
console.log('- URLs in fund section are placeholders - verify actual URLs');
console.log('\n🔍 Next steps:');
console.log('1. Run discovery WITH fund created to find actual fund-level menu items');
console.log('2. Update fund section URLs with actual discovered URLs');
console.log('3. Add any additional fund-level pages discovered\n');
