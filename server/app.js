/**
 * app.js — Express application entry point
 * AMC 2027 Conference Registration Server
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const registrationsRouter = require('./routes/registrations');
const paymentsRouter = require('./routes/payments');
const adminRouter = require('./routes/admin');
const emailRouter = require('./routes/email');
const authRouter = require('./routes/auth');
const scheduleRouter = require('./routes/schedule');
const speakersRouter = require('./routes/speakers');
const hotelsRouter = require('./routes/hotels');
const uploadsRouter = require('./routes/uploads');
const resourcesRouter = require('./routes/resources');
const awardsRouter = require('./routes/awards');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────────────────
// crossOriginResourcePolicy is relaxed so the separately-hosted frontend can
// load uploaded images (e.g. speaker photos) served from /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — only allow the configured client origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Uploads ───────────────────────────────────────────────────────────
// Uploaded speaker photos etc. Served read-only, with long-lived caching.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    fallthrough: false,
    index: false,
  })
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AMC 2027 Conference API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/registrations', registrationsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/email', emailRouter);
app.use('/api/auth', authRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/speakers', speakersRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/awards', awardsRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌍 AMC 2027 Conference API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
