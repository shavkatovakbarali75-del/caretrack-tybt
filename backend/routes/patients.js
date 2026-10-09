const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly, clinicianAccess } = require('../middleware/auth');
const logActivity = require('../logActivity');

// Barcha bemorlar
router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT p.*, d.full_name as doctor_name FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id';
    let params = [];
    if (search) {
      sql += ' WHERE p.full_name LIKE ? OR d.full_name LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }
    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bemor profili (shifokor + kasalliklar bilan)
router.get('/:id', auth, async (req, res) => {
  try {
    const [patients] = await db.query('SELECT p.*, d.full_name as doctor_name, d.specialization as doctor_spec FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id WHERE p.id = ?', [req.params.id]);
    if (!patients.length) return res.status(404).json({ error: 'Topilmadi' });
    const [diseases] = await db.query('SELECT * FROM diseases WHERE patient_id = ? ORDER BY diagnosed_date DESC', [req.params.id]);
    res.json({ ...patients[0], diseases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yaratish
router.post('/', auth, clinicianAccess, async (req, res) => {
  try {
    const { full_name, birth_date, gender, phone, address, doctor_id } = req.body;
    const [result] = await db.query('INSERT INTO patients (full_name, birth_date, gender, phone, address, doctor_id) VALUES (?, ?, ?, ?, ?, ?)', [full_name, birth_date, gender, phone, address, doctor_id]);
    await logActivity(req.user.full_name, 'yaratdi', 'Bemor', full_name);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yangilash
router.put('/:id', auth, clinicianAccess, async (req, res) => {
  try {
    const { full_name, birth_date, gender, phone, address, doctor_id } = req.body;
    await db.query('UPDATE patients SET full_name=?, birth_date=?, gender=?, phone=?, address=?, doctor_id=? WHERE id=?', [full_name, birth_date, gender, phone, address, doctor_id, req.params.id]);
    await logActivity(req.user.full_name, 'yangiladi', 'Bemor', full_name);
    res.json({ message: 'Yangilandi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// O'chirish (faqat admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await logActivity(req.user.full_name, 'o\'chirdi', 'Bemor', `ID: ${req.params.id}`);
    await db.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
