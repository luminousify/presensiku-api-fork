const express = require('express');
const dotenv  = require('dotenv');
const path = require('path');
const upload = require('./middleware/upload'); // validated: jpg/png/webp, 5MB cap

dotenv.config();

// Fail closed: no secret, no server (audit fix d)
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set. Refusing to start.');
    process.exit(1);
}

const app = express();

const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use((req, res, next) => {
    console.log('Content-Type masuk:', req.headers['content-type']);
    console.log('Method:', req.method, req.path);
    next();
});

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Asli
const authRoutes       = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes      = require('./routes/leaveRoutes');
const settingsRoutes   = require('./routes/settingsRoutes'); // Rute baru ditarik

app.use('/api/auth',       authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves',     leaveRoutes);
app.use('/api/cuti', require('./routes/leaveRoutes'));
app.use('/api/settings',   settingsRoutes); // Rute baru dipasang

app.get('/', (req, res) => res.send('PresensIKu API is running 🚀'));

const PORT = process.env.PORT || 3000;

app.post('/test-upload', upload.single('selfie'), (req, res) => {
    console.log('file:', req.file);
    console.log('body:', req.body);
    res.json({ file: req.file, body: req.body });
});

// Upload validation errors are client errors (audit fix e)
app.use((err, req, res, next) => {
    if (err && (err.code === 'LIMIT_FILE_SIZE' || /gambar/i.test(err.message || ''))) {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

// Supertest entry point: only bind a port when run directly
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
}