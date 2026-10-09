const router = require('express').Router();
const db = require('../db');
const { auth, clinicianAccess, adminOnly } = require('../middleware/auth');
const logActivity = require('../logActivity');

// Barcha kasalliklar
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT dis.*, p.full_name as patient_name FROM diseases dis LEFT JOIN patients p ON dis.patient_id = p.id';
    let params = [];
    if (search) {
      sql += ' WHERE dis.name LIKE ? OR dis.icd_code LIKE ? OR p.full_name LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    sql += ' ORDER BY dis.created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bitta kasallik
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT dis.*, p.full_name as patient_name FROM diseases dis LEFT JOIN patients p ON dis.patient_id = p.id WHERE dis.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Topilmadi' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yaratish
router.post('/', auth, clinicianAccess, async (req, res) => {
  try {
    const { icd_code, name, description, severity, patient_id, diagnosed_date } = req.body;
    const [result] = await db.query('INSERT INTO diseases (icd_code, name, description, severity, patient_id, diagnosed_date) VALUES (?, ?, ?, ?, ?, ?)', [icd_code, name, description, severity, patient_id, diagnosed_date]);
    await logActivity(req.user.full_name, 'yaratdi', 'Tashxis', name);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yangilash
router.put('/:id', auth, clinicianAccess, async (req, res) => {
  try {
    const { icd_code, name, description, severity, patient_id, diagnosed_date } = req.body;
    await db.query('UPDATE diseases SET icd_code=?, name=?, description=?, severity=?, patient_id=?, diagnosed_date=? WHERE id=?', [icd_code, name, description, severity, patient_id, diagnosed_date, req.params.id]);
    await logActivity(req.user.full_name, 'yangiladi', 'Tashxis', name);
    res.json({ message: 'Yangilandi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// O'chirish (faqat admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await logActivity(req.user.full_name, 'o\'chirdi', 'Tashxis', `ID: ${req.params.id}`);
    await db.query('DELETE FROM diseases WHERE id = ?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
