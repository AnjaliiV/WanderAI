'use strict';
require('dotenv').config();

const { initDb } = require('./db/connect');
const app = require('./app');

// Initialize Firebase & Firestore synchronously
initDb();
console.log('[DB] ✅ Firebase & Firestore ready (v2)');

const PORT = process.env.PORT || 3000;

// Vercel serverless functions shouldn't call app.listen(), but standard Node servers should
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🌍 AI Trip Planner server running`);
    console.log(`   → http://localhost:${PORT}`);
    console.log(`   → Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   → Gemini API  : ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing'}\n`);
  });
}

// Export the app for Vercel Serverless
module.exports = app;
