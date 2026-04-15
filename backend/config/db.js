const mysql = require('mysql2/promise');

const connectionLimit = Number.parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'college_events',
  connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  namedPlaceholders: false,
  dateStrings: true,
  typeCast: true,
  multipleStatements: false,
});

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();

    console.log(
      'MySQL connected | host=%s database=%s pool=%d',
      process.env.DB_HOST || 'localhost',
      process.env.DB_NAME || 'college_events',
      connectionLimit
    );
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    throw error;
  } finally {
    connection?.release();
  }
}

module.exports = { pool, testConnection };
