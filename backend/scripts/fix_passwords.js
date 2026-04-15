require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const password = 'Password123!';
  const hash = await bcrypt.hash(password, 10);

  console.log('Generated hash:', hash);
  console.log('Updating all users...');

  const [result] = await pool.execute(
    'UPDATE users SET password_hash = ?',
    [hash]
  );

  console.log(`✅ Updated ${result.affectedRows} users with password: ${password}`);
  await pool.end();
}

main().catch(console.error);
