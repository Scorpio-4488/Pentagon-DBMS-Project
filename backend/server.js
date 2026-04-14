/**
 * ============================================================
 * Server Entry Point — Express Application Bootstrap
 * ============================================================
 *
 * Sets up the Express server with:
 *   - Environment configuration (dotenv)
 *   - Security middleware (Helmet, CORS)
 *   - Request parsing (JSON body parser)
 *   - HTTP request logging (Morgan)
 *   - API route mounting
 *   - Global error handling
 *   - MySQL connection verification at startup
 *
 * Run: npm start (production) or npm run dev (with nodemon)
 * ============================================================
 */

// ── Load environment variables FIRST ──
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const apiRoutes       = require('./routes/api');
const { testConnection } = require('./config/db');

// ── Initialize Express ──
const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;


// ╔══════════════════════════════════════════════════════════╗
// ║  MIDDLEWARE STACK                                       ║
// ╚══════════════════════════════════════════════════════════╝

// 1. Security headers (Content-Security-Policy, X-Frame-Options, etc.)
app.use(helmet());

// 2. CORS — allow frontend origins
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',     // Restrict in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 3. Parse JSON request bodies (limit payload size to 10MB)
app.use(express.json({ limit: '10mb' }));

// 4. Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// 5. HTTP request logging
//    - 'dev' format for development (colored, concise)
//    - 'combined' for production (Apache-style)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));


// ╔══════════════════════════════════════════════════════════╗
// ║  ROUTES                                                 ║
// ╚══════════════════════════════════════════════════════════╝

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status:  'healthy',
      service: 'College Event Management API',
      version: '1.0.0',
      uptime:  `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
    }
  });
});

// Mount all API routes under /api prefix
app.use('/api', apiRoutes);


// ╔══════════════════════════════════════════════════════════╗
// ║  ERROR HANDLING                                         ║
// ╚══════════════════════════════════════════════════════════╝

// 404 — Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} does not exist.`,
    }
  });
});

// 500 — Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('─── Unhandled Error ───');
  console.error('Route:', req.method, req.originalUrl);
  console.error('Error:', err.stack || err);
  console.error('───────────────────────');

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message,
    }
  });
});


// ╔══════════════════════════════════════════════════════════╗
// ║  SERVER STARTUP                                         ║
// ╚══════════════════════════════════════════════════════════╝

async function startServer() {
  try {
    // Verify MySQL connectivity before accepting requests
    await testConnection();

    app.listen(PORT, () => {
      console.log('');
      console.log('══════════════════════════════════════════════════');
      console.log('  College Event Management API');
      console.log('══════════════════════════════════════════════════');
      console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Server      : http://localhost:${PORT}`);
      console.log(`  API Base    : http://localhost:${PORT}/api`);
      console.log(`  Health      : http://localhost:${PORT}/api/health`);
      console.log('══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (err) {
    console.error('');
    console.error('❌  Failed to start server:', err.message);
    console.error('   Ensure MySQL is running and .env credentials are correct.');
    console.error('');
    process.exit(1);
  }
}

startServer();
