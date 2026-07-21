'use strict';
require('dotenv').config();

const { initDb } = require('./db/connect');
const { initializeApp, cert } = require('firebase-admin/app');
const path = require('path');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Initialise Firebase Admin
    let serviceAccount;
    if (process.env.FIREBASE_CREDENTIALS) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
      serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));
    }
    
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('[Auth] ✅ Firebase Admin SDK ready');

    // Initialise the database FIRST (sql.js needs async WASM load)
    await initDb();
    console.log('[DB] ✅ Database ready');

    // Only require app AFTER DB is ready, so models work immediately
    const app = require('./app');

    app.listen(PORT, () => {
      console.log(`\n🌍 AI Trip Planner server running`);
      console.log(`   → http://localhost:${PORT}`);
      console.log(`   → Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   → Gemini API  : ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing (set GEMINI_API_KEY in .env)'}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
