const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { pool } = require('../config/db');

const SALT_ROUNDS = 10;
const ALLOWED_EMAIL_DOMAIN = '@iiit-bh.ac.in';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;
const DEFAULT_ROLE = 'student';
const REGISTERABLE_ROLES = ['student', 'admin'];
const REGISTERABLE_ROLE_SET = new Set(REGISTERABLE_ROLES);

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatNamePart(value, fallback) {
  if (!value) {
    return fallback;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getRegistrationNames(firstName, lastName, email) {
  const normalizedFirstName = normalizeText(firstName);
  const normalizedLastName = normalizeText(lastName);

  if (normalizedFirstName && normalizedLastName) {
    return { firstName: normalizedFirstName, lastName: normalizedLastName };
  }

  const [localPart = 'campus.user'] = email.split('@');
  const [firstPart, lastPart] = localPart.split(/[._-]+/).filter(Boolean);

  return {
    firstName: normalizedFirstName || formatNamePart(firstPart, 'Campus'),
    lastName: normalizedLastName || formatNamePart(lastPart, 'User'),
  };
}

function validateEmail(email, action) {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return {
      ok: false,
      status: 400,
      error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' },
    };
  }

  if (!normalizedEmail.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return {
      ok: false,
      status: 400,
      error: {
        code: 'INVALID_DOMAIN',
        message: `Only IIIT Bhubaneswar email addresses ending with ${ALLOWED_EMAIL_DOMAIN} can be used to ${action}.`,
      },
    };
  }

  return { ok: true, value: normalizedEmail };
}

function validateRegistrationRole(role, adminSecretKey) {
  const normalizedRole = normalizeText(role).toLowerCase() || DEFAULT_ROLE;

  if (!REGISTERABLE_ROLE_SET.has(normalizedRole)) {
    return {
      ok: false,
      status: 400,
      error: {
        code: 'INVALID_ROLE',
        message: `Role must be one of: ${REGISTERABLE_ROLES.join(', ')}`,
      },
    };
  }

  if (normalizedRole !== 'admin') {
    return { ok: true, value: normalizedRole };
  }

  const configuredAdminKey = normalizeText(process.env.ADMIN_REGISTRATION_KEY);
  const submittedAdminKey = normalizeText(adminSecretKey);

  if (!configuredAdminKey) {
    return {
      ok: false,
      status: 403,
      error: {
        code: 'ADMIN_REGISTRATION_DISABLED',
        message: 'Admin registration is not available right now.',
      },
    };
  }

  if (!submittedAdminKey || submittedAdminKey !== configuredAdminKey) {
    return {
      ok: false,
      status: 403,
      error: {
        code: 'ADMIN_AUTH_REQUIRED',
        message: 'A valid admin registration key is required to create an admin account.',
      },
    };
  }

  return { ok: true, value: normalizedRole };
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT user_id, first_name, last_name, email, password_hash, role, department, phone, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function countUsersByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM users WHERE email = ?',
    [email]
  );

  return rows[0]?.total ?? 0;
}

function looksLikeBcryptHash(passwordHash) {
  return typeof passwordHash === 'string' && BCRYPT_HASH_REGEX.test(passwordHash);
}

function createAuthUser(user, token) {
  return {
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    department: user.department ?? null,
    token,
  };
}

async function verifyStoredUser(email, plainPassword) {
  const [user, duplicateCount] = await Promise.all([
    findUserByEmail(email),
    countUsersByEmail(email),
  ]);

  const userExistsInDB = Boolean(user);
  const emailMatches = user?.email === email;
  const passwordIsHashed = Boolean(user)
    && user.password_hash !== plainPassword
    && looksLikeBcryptHash(user.password_hash);
  const passwordMatches = passwordIsHashed
    ? await bcrypt.compare(plainPassword, user.password_hash)
    : false;

  return {
    user,
    duplicateCount,
    userExistsInDB,
    emailMatches,
    passwordIsHashed,
    passwordMatches,
  };
}

function debugEndpointEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEBUG_ENDPOINT === 'true';
}

function signToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

async function register(req, res) {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role = DEFAULT_ROLE,
      admin_secret_key,
      department = null,
      phone = null,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required.',
        },
      });
    }

    const emailCheck = validateEmail(email, 'register');
    if (!emailCheck.ok) {
      return res.status(emailCheck.status).json({
        success: false,
        error: emailCheck.error,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long.',
        },
      });
    }

    const roleCheck = validateRegistrationRole(role, admin_secret_key);
    if (!roleCheck.ok) {
      return res.status(roleCheck.status).json({
        success: false,
        error: roleCheck.error,
      });
    }

    const names = getRegistrationNames(first_name, last_name, emailCheck.value);
    const normalizedDepartment = normalizeText(department) || null;
    const normalizedPhone = normalizeText(phone) || null;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, department, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        names.firstName,
        names.lastName,
        emailCheck.value,
        passwordHash,
        roleCheck.value,
        normalizedDepartment,
        normalizedPhone,
      ]
    );

    const savedUser = {
      user_id: result.insertId,
      first_name: names.firstName,
      last_name: names.lastName,
      email: emailCheck.value,
      password_hash: passwordHash,
      role: roleCheck.value,
      department: normalizedDepartment,
      phone: normalizedPhone,
    };
    console.log('[AuthController] saved user:', savedUser);

    const verification = await verifyStoredUser(emailCheck.value, password);
    console.log('[AuthController] fetched user from DB:', verification.user);

    if (!verification.userExistsInDB) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_VERIFICATION_FAILED',
          message: 'User was created, but verification in the database failed.',
        },
      });
    }

    if (verification.duplicateCount > 1) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DUPLICATE_USER_RECORDS',
          message: 'Duplicate user records were detected for this email.',
        },
      });
    }

    if (!verification.emailMatches || !verification.passwordIsHashed || !verification.passwordMatches) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_DATA_MISMATCH',
          message: 'User was created, but stored data verification failed.',
        },
      });
    }

    const token = signToken({
      user_id: verification.user.user_id,
      email: verification.user.email,
      role: verification.user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userExistsInDB: true,
      data: {
        ...createAuthUser(verification.user, token),
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists.',
        },
      });
    }

    console.error('[AuthController] register failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Registration failed. Please try again.' },
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' },
      });
    }

    const emailCheck = validateEmail(email, 'log in');
    if (!emailCheck.ok) {
      return res.status(emailCheck.status).json({
        success: false,
        error: emailCheck.error,
      });
    }

    const user = await findUserByEmail(emailCheck.value);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const token = signToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        department: user.department,
        token,
      },
    });
  } catch (error) {
    console.error('[AuthController] login failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed. Please try again.' },
    });
  }
}

async function debugUser(req, res) {
  if (!debugEndpointEnabled()) {
    return res.status(403).json({
      success: false,
      error: { code: 'DEBUG_DISABLED', message: 'Debug endpoint is disabled.' },
    });
  }

  if (!req.query.email) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email query parameter is required.' },
    });
  }

  const emailCheck = validateEmail(req.query.email, 'look up');
  if (!emailCheck.ok) {
    return res.status(emailCheck.status).json({
      success: false,
      error: emailCheck.error,
    });
  }

  try {
    const [user, duplicateCount] = await Promise.all([
      findUserByEmail(emailCheck.value),
      countUsersByEmail(emailCheck.value),
    ]);

    console.log('[AuthController] debug user lookup:', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'No user found for this email.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        userExistsInDB: true,
        duplicateCount,
        passwordIsHashed: looksLikeBcryptHash(user.password_hash),
      },
    });
  } catch (error) {
    console.error('[AuthController] debugUser failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user from the database.' },
    });
  }
}

async function getProfile(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT user_id, first_name, last_name, email, role, department, phone, created_at
       FROM users
       WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account not found.' },
      });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[AuthController] getProfile failed:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile.' },
    });
  }
}

module.exports = { register, login, getProfile, debugUser };
