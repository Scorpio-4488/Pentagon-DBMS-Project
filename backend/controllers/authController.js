/**
 * ============================================================
 * Auth Controller — Registration & Login
 * ============================================================
 *
 * Handles user registration (POST /api/auth/register) and
 * login (POST /api/auth/login). Passwords are hashed with
 * bcrypt; authentication tokens are signed with RS256 JWT.
 *
 * Raw SQL only — no ORM.
 * ============================================================
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

// ─── Number of bcrypt salt rounds ───
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 * Hashes the password before storing.
 *
 * Body: { first_name, last_name, email, password, role?, department?, phone? }
 */
async function register(req, res) {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role = 'student',    // Default role
      department = null,
      phone = null,
    } = req.body;

    // ── Input validation ──
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Fields first_name, last_name, email, and password are required.'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' }
      });
    }

    // Validate role
    const validRoles = ['student', 'organizer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: `Role must be one of: ${validRoles.join(', ')}` }
      });
    }

    // Validate password strength (minimum 8 chars)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' }
      });
    }

    // ── Hash password ──
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Insert into database ──
    const sql = `
      INSERT INTO users (first_name, last_name, email, password_hash, role, department, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      first_name, last_name, email, password_hash, role, department, phone,
    ]);

    // ── Generate JWT ──
    const token = jwt.sign(
      { user_id: result.insertId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({
      success: true,
      data: {
        user_id: result.insertId,
        first_name,
        last_name,
        email,
        role,
        token,
      }
    });

  } catch (err) {
    // ── Handle duplicate email (MySQL error code 1062) ──
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' }
      });
    }

    console.error('[AuthController] Register error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Registration failed. Please try again.' }
    });
  }
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user and returns a JWT.
 *
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // ── Input validation ──
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' }
      });
    }

    // ── Fetch user by email ──
    const sql = `SELECT user_id, first_name, last_name, email, password_hash, role, department
                 FROM users WHERE email = ?`;
    const [rows] = await pool.execute(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    const user = rows[0];

    // ── Verify password ──
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    // ── Generate JWT ──
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      data: {
        user_id:    user.user_id,
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
        role:       user.role,
        department: user.department,
        token,
      }
    });

  } catch (err) {
    console.error('[AuthController] Login error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed. Please try again.' }
    });
  }
}

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's profile.
 * Requires: authenticate middleware.
 */
async function getProfile(req, res) {
  try {
    const sql = `
      SELECT user_id, first_name, last_name, email, role, department, phone, created_at
      FROM users WHERE user_id = ?
    `;
    const [rows] = await pool.execute(sql, [req.user.user_id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account not found.' }
      });
    }

    return res.status(200).json({ success: true, data: rows[0] });

  } catch (err) {
    console.error('[AuthController] GetProfile error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile.' }
    });
  }
}

module.exports = { register, login, getProfile };
