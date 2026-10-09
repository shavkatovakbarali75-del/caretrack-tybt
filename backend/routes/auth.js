const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Parol noto\'g\'ri' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, full_name: user.full_name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
