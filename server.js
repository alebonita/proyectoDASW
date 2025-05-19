const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./db");
const User = require("./User"); 
const Asesoria = require("./Asesoria");
const AsesoriaAlumno = require("./AsesoriaAlumno");
const AutoIncrement = require('mongoose-sequence')(mongoose);
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000; // ✅ obligatorio en Render

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Carpeta de imágenes
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});
const upload = multer({ storage });

// Conexión a Mongo
connectDB();

// RUTA DE PRUEBA (puedes borrar si no la usas)
app.get('/api/urlbase', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`Tu URL base es: ${baseUrl}`);
});

// ... todas tus rutas como están ...

// Dentro de la ruta POST de asesorías: reemplaza esta línea:
imagen: req.file ? `http://localhost:8000/uploads/${req.file.filename}` : null

// Por esta (dentro del handler POST):
imagen: req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null

// También reemplaza lo mismo en el GET que arma las URLs de imágenes:
if (asesoria.imagen && !asesoria.imagen.startsWith('http')) {
  asesoria.imagen = `${req.protocol}://${req.get('host')}${asesoria.imagen}`;
}

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Sistema de Asesorías funcionando correctamente ✅');
});

// Escuchar en el puerto dinámico de Render
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
