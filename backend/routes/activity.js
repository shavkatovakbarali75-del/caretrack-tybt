const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
