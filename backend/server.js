const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/diseases', require('./routes/diseases'));
app.use('/api/activity', require('./routes/activity'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishga tushdi`));
