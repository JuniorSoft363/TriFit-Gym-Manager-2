// Middleware: subida de archivos con multer (almacenamiento en disco)
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const carpetaTemporal = path.join(__dirname, '..', '..', 'uploads', 'tmp');
if (!fs.existsSync(carpetaTemporal)) fs.mkdirSync(carpetaTemporal, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaTemporal),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

module.exports = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});
