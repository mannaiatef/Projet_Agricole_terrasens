#!/usr/bin/env node

/**
 * Database Migration Script
 * Usage: node scripts/migrate.js
 */

require('dotenv').config();
const Migration = require('../src/config/migration');

async function main() {
  try {
    await Migration.up();
    console.log('\n✨ Database migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }
}

main();
