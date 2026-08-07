/**
 * scripts/createAdmin.js
 * Creates the admins table (if missing) and upserts the default admin user.
 * Run: node scripts/createAdmin.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const { query } = require('../config/db');

async function main() {
  console.log('Creating admins table...');
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
  console.log('✅ Table ready.');

  const email = 'admin@amc2027.org';
  const password = 'Admin@2027';
  const hash = await bcrypt.hash(password, 12);

  await query(
    `INSERT INTO admins (name, email, password_hash)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['AMC Administrator', email, hash]
  );

  console.log(`✅ Admin user created/updated.`);
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log('\n⚠️  Change this password after first login!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
