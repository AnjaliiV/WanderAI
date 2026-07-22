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
        // Fix for Vercel: literal \n might get escaped as \\n
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
      } else {
        serviceAccount = require(path.join(__dirname, '..', '..', 'firebase-service-account.json'));
      }
      initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (error) {
      console.error('[DB] 🔥 Firebase Admin Init Error:', error);
    }
  }

  try {
    db = getFirestore();
  } catch (error) {
    console.error('[DB] 🔥 Firestore Init Error:', error);
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
