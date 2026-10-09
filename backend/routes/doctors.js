const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');
const logActivity = require('../logActivity');

// Barcha shifokorlar (qidirish bilan)
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM doctors';
    let params = [];
    if (search) {
      sql += ' WHERE full_name LIKE ? OR specialization LIKE ? OR department LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bitta shifokor
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Topilmadi' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yaratish (faqat admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { full_name, specialization, department, phone, email } = req.body;
    const [result] = await db.query('INSERT INTO doctors (full_name, specialization, department, phone, email) VALUES (?, ?, ?, ?, ?)', [full_name, specialization, department, phone, email]);
    await logActivity(req.user.full_name, 'yaratdi', 'Shifokor', full_name);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yangilash (faqat admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { full_name, specialization, department, phone, email } = req.body;
    await db.query('UPDATE doctors SET full_name=?, specialization=?, department=?, phone=?, email=? WHERE id=?', [full_name, specialization, department, phone, email, req.params.id]);
    await logActivity(req.user.full_name, 'yangiladi', 'Shifokor', full_name);
    res.json({ message: 'Yangilandi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// O'chirish (faqat admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await logActivity(req.user.full_name, 'o\'chirdi', 'Shifokor', `ID: ${req.params.id}`);
    await db.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
