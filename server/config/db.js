/**
 * config/db.js — MySQL2 connection pool
 * Exports a promise-based query() helper for all DB operations.
 */

const mysql = require('mysql2/promise');

/**
 * Every timestamp in the schema is a MySQL TIMESTAMP written by NOW() /
 * CURRENT_TIMESTAMP — i.e. the session's wall clock. Both halves of that
 * conversation have to agree on which zone that wall clock is in:
 *
 *   - DB_TIMEZONE pins the *session* zone so MySQL never falls back to SYSTEM
 *     (this host's /etc/timezone and /etc/localtime disagree, and a SYSTEM zone
 *     that drifts would silently re-date every record).
 *   - The same value goes to mysql2 so it parses those wall-clock strings back
 *     into the correct instant.
 *
 * These two were previously mismatched — MySQL wrote Harare time, mysql2 read
 * it as UTC — which pushed anything recorded after 22:00 onto the following day
 * once the browser rendered it back in local time.
 */
const DB_TIMEZONE = process.env.DB_TIMEZONE || '+02:00';

// Create a connection pool for efficient connection reuse
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'amc_conference_2027',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: DB_TIMEZONE,
  charset: 'utf8mb4',
});

// Pin the session zone on every new pooled connection, reconnects included.
pool.on('connection', (conn) => {
  conn.query('SET time_zone = ?', [DB_TIMEZONE], (err) => {
    if (err) console.error('[DB] Could not pin session time_zone:', err.message);
  });
});

/**
 * Execute a parameterised SQL query using the pool.
 * @param {string} sql   — SQL statement with ? placeholders
 * @param {Array}  params — Values to bind
 * @returns {Promise<[Array, Array]>} [rows, fields]
 */
async function query(sql, params = []) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return [rows, fields];
  } catch (err) {
    console.error('[DB Error]', err.message, { sql });
    throw err;
  }
}

/**
 * Get a connection from the pool (for transactions).
 */
async function getConnection() {
  return pool.getConnection();
}

// Verify connection on startup
pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL connected to database:', process.env.DB_NAME);
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = { query, getConnection, pool };
