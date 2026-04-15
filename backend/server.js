require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const { testConnection } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'College Event Management API',
      version: '1.0.0',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} does not exist.`,
    },
  });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error('Unhandled error on %s %s', req.method, req.originalUrl);
  console.error(error.stack || error);

  res.status(error.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : error.message,
    },
  });
});

async function startServer() {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log('API ready on http://localhost:%d', PORT);
      console.log('Health check: http://localhost:%d/api/health', PORT);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
