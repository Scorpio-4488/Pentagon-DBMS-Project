/**
 * ============================================================
 * Database Configuration — MySQL Connection Pool
 * ============================================================
 *
 * Uses mysql2/promise to create a reusable connection pool.
 * All controllers acquire connections from this pool and
 * release them back automatically after query execution.
 *
 * Pool advantages over single connections:
 *  - Reuses existing connections (avoids handshake overhead)
 *  - Limits max concurrent connections to prevent DB overload
 *  - Auto-reconnects on transient failures
 * ============================================================
 */

const mysql = require('mysql2/promise');

/**
 * Create a connection pool with settings from environment variables.
 * The pool lazily creates connections on demand up to `connectionLimit`.
 */
const pool = mysql.createPool({
  host:            process.env.DB_HOST || 'localhost',
  port:            parseInt(process.env.DB_PORT, 10) || 3306,
  user:            process.env.DB_USER || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME || 'college_events',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,

  // —— Connection behavior ——
  waitForConnections: true,       // Queue requests when pool is exhausted
  queueLimit:         0,          // Unlimited queue (0 = no limit)
  connectTimeout:     10000,      // 10s timeout for initial connection
  enableKeepAlive:    true,       // Prevent idle connection drops
  keepAliveInitialDelay: 10000,   // 10s before first keep-alive probe

  // —— Query behavior ——
  namedPlaceholders:  false,      // Use ? placeholders (standard)
  dateStrings:        true,       // Return dates as strings, not JS Date objects
  typeCast:           true,       // Auto-cast MySQL types to JS types
  multipleStatements: false,      // Security: prevent SQL injection via stacked queries
});

/**
 * Verify database connectivity at startup.
 * Acquires one connection, pings the server, and releases it.
 * Throws if the database is unreachable.
 */
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('✅  MySQL connected  │  Host: %s  │  Database: %s  │  Pool size: %d',
      process.env.DB_HOST || 'localhost',
      process.env.DB_NAME || 'college_events',
      parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
    );
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { pool, testConnection };
