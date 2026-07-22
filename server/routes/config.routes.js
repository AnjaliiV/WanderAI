'use strict';
const express = require('express');
const router = express.Router();

router.get('/firebase', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    version: 2
  });
});

module.exports = router;
