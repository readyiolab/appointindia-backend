/**
 * Create or promote an admin user.
 * Usage: node scripts/create-admin.js email@example.com "YourPassword"
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'job_portal',
  });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [existing] = await connection.query(
      'SELECT id, email, role FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      [email]
    );

    if (existing.length > 0) {
      await connection.query(
        `UPDATE users SET role = 'admin', status = 'active', password_hash = ?, email_verified = 1, updated_at = NOW() WHERE id = ?`,
        [passwordHash, existing[0].id]
      );
      console.log(`Updated existing user to admin: ${email}`);
    } else {
      const id = uuidv4();
      await connection.query(
        `INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', 'active', 1, NOW(), NOW())`,
        [id, email, passwordHash]
      );
      console.log(`Created admin user: ${email}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
