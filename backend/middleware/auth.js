const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token talab qilinadi' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Yaroqsiz token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Faqat admin uchun' });
  next();
}

function clinicianAccess(req, res, next) {
  if (!['admin', 'clinician'].includes(req.user.role)) return res.status(403).json({ error: 'Ruxsat yo\'q' });
  next();
}

module.exports = { auth, adminOnly, clinicianAccess };
