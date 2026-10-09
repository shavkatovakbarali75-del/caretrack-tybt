const db = require('./db');

async function logActivity(userName, action, target, details = '') {
  try {
    await db.query('INSERT INTO activity_log (user_name, action, target, details) VALUES (?, ?, ?, ?)', [userName, action, target, details]);
  } catch (e) { /* silent */ }
}

module.exports = logActivity;
