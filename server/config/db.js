/**
 * config/db.js — MySQL2 connection pool
 * Exports a promise-based query() helper for all DB operations.
 */

const mysql = require('mysql2/promise');

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
  timezone: '+00:00', // Store all times in UTC
  charset: 'utf8mb4',
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
