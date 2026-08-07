#!/usr/bin/env node

/**
 * runSeed.js — Execute seed SQL file
 * Usage: node scripts/runSeed.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fs = require('fs');
const { query } = require('../config/db');

async function runSeed() {
  try {
    const seedPath = path.join(__dirname, '../db/seeds/seed_conference_content.sql');
    const sql = fs.readFileSync(seedPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      try {
        await query(statements[i]);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        console.error(`✗ Statement ${i + 1} failed:`, err.message);
        // Continue with next statement
      }
    }
    
    console.log('✅ Seed completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

runSeed();
