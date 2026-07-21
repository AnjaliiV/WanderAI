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
    if (process.env.FIREBASE_CREDENTIALS) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
      serviceAccount = require(path.join(__dirname, '..', '..', 'firebase-service-account.json'));
    }
    initializeApp({
      credential: cert(serviceAccount)
    });
  }

  db = getFirestore();
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
