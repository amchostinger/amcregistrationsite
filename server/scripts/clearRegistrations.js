/**
 * scripts/clearRegistrations.js
 * Go-live reset: deletes ALL registration, payment and hotel-booking records
 * and resets their AUTO_INCREMENT counters, so the live site starts from a
 * clean slate. Speakers, schedule, hotels, settings and admins are untouched.
 *
 * Usage:
 *   node scripts/clearRegistrations.js          # show what would be deleted
 *   node scripts/clearRegistrations.js --yes    # actually delete
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('../config/db');

// Child rows first — payments and bookings reference registrants.
const TABLES = ['payments', 'hotel_bookings', 'registrants', 'admin_audit_log'];

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return rows[0].n > 0;
}

async function main() {
  const confirmed = process.argv.includes('--yes');
  const conn = await pool.getConnection();

  try {
    console.log(`\nDatabase: ${process.env.DB_NAME}\n`);

    const present = [];
    for (const table of TABLES) {
      if (!(await tableExists(conn, table))) {
        console.log(`   ${table.padEnd(16)} — table not present, skipping`);
        continue;
      }
      const [rows] = await conn.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
      console.log(`   ${table.padEnd(16)} ${rows[0].n} row(s)`);
      present.push(table);
    }

    if (!confirmed) {
      console.log('\nDry run. Re-run with --yes to permanently delete these rows.\n');
      return;
    }

    console.log('\nDeleting…');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of present) {
      await conn.query(`DELETE FROM \`${table}\``);
      await conn.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
      console.log(`   ✅ ${table} cleared and counter reset`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ All registration and payment data cleared. Ready for go-live.\n');
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message, '\n');
  process.exit(1);
});
