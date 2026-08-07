/**
 * scripts/seedAdmins.js
 * Creates (or resets the password of) the AMC administrator accounts.
 * Safe to re-run: existing accounts are updated in place, other admins are
 * left alone.
 *
 * Usage: node scripts/seedAdmins.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const { query, pool } = require('../config/db');

const ADMINS = [
  { name: 'AMC Communications',   email: 'communications@africamethodistcouncil.org', password: '@communications!Afric@17' },
  { name: 'AMC General Secretary', email: 'gensec@africamethodistcouncil.org',        password: '@gensec4Peace' },
  { name: 'AMC Info Desk',        email: 'info@africamethodistcouncil.org',           password: '@info!Africa17' },
  { name: 'AMC Youth',            email: 'amcyouth@africamethodistcouncil.org',       password: '@Young!Africa26' },
  { name: 'AMC President',        email: 'amcpresident@africamethodistcouncil.org',   password: '!Am@presidEnt192' },
  { name: 'AMC Treasurer',        email: 'amctreasurer@africamethodistcouncil.org',   password: '!Amc@Finance250' },
];

async function main() {
  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      is_active     TINYINT(1)   NOT NULL DEFAULT 1,
      last_login    DATETIME,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log(`\nDatabase: ${process.env.DB_NAME}\n`);

  for (const admin of ADMINS) {
    // Login looks up email.toLowerCase(), so store it lowercased.
    const email = admin.email.toLowerCase();
    const hash = await bcrypt.hash(admin.password, 12);
    await query(
      `INSERT INTO admins (name, email, password_hash, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         is_active = 1`,
      [admin.name, email, hash]
    );
    console.log(`   ✅ ${email}`);
  }

  console.log(`\n✅ ${ADMINS.length} administrator account(s) ready.\n`);
  await pool.end();
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message, '\n');
  process.exit(1);
});
