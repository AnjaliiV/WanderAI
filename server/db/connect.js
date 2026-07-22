'use strict';
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

let db = null;

function initDb() {
  if (db) return db;

  // Ensure Firebase Admin is initialized
  if (getApps().length === 0) {
    let serviceAccount;
    try {
      if (process.env.FIREBASE_CREDENTIALS) {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
      } else {
        // Use fs instead of require to prevent Vercel's bundler from attempting to bundle a missing ignored file
        const fs = require('fs');
        const jsonPath = path.join(__dirname, '..', '..', 'firebase-service-account.json');
        if (fs.existsSync(jsonPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } else {
          console.error('[DB] 🔥 Missing FIREBASE_CREDENTIALS and no local json file found');
        }
      }
      
      if (serviceAccount) {
        initializeApp({ credential: cert(serviceAccount) });
        db = getFirestore();
      }
    } catch (error) {
      console.error('[DB] 🔥 Firebase Admin Init Error:', error);
    }
  } else {
    try {
      db = getFirestore();
    } catch(e) {}
  }
  
  return db;
}

function getDb() {
  if (!db) {
    return initDb();
  }
  return db;
}

module.exports = {
  initDb,
  getDb
};
