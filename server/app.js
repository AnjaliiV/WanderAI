'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');

const planRoutes = require('./routes/plan.routes');
const searchRoutes = require('./routes/search.routes');
const reviewRoutes = require('./routes/review.routes');
const configRoutes = require('./routes/config.routes');
const destinationRoutes = require('./routes/destination.routes');

const app = express();

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (serve frontend) ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/plan',         planRoutes);
app.use('/api/search',       searchRoutes);
app.use('/api/reviews',      reviewRoutes);
app.use('/api/config',       configRoutes);
app.use('/api/destinations', destinationRoutes);

// ─── SPA Fallback ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
