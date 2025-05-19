

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
const port = process.env.PORT || 8000;

// Configuración de middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de Multer para subir imágenes
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const upload = multer({ storage });

// Conexión a MongoDB
connectDB();

// RUTAS

// Ruta de prueba
app.get('/api/urlbase', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`Tu URL base es: ${baseUrl}`);
});

// Ejemplo de ruta POST para crear asesorías con imagen
app.post('/api/asesorias', upload.single('imagen'), async (req, res) => {
  try {
    const nuevaAsesoria = new Asesoria({
      // ... otros campos ...
      imagen: req.file ? `/uploads/${req.file.filename}` : null
    });

    await nuevaAsesoria.save();
    res.status(201).json(nuevaAsesoria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejemplo de ruta GET para obtener asesorías con URLs completas
app.get('/api/asesorias', async (req, res) => {
  try {
    const asesorias = await Asesoria.find();
    
    const asesoriasConUrlCompleta = asesorias.map(asesoria => {
      if (asesoria.imagen && !asesoria.imagen.startsWith('http')) {
        return {
          ...asesoria.toObject(),
          imagen: `${req.protocol}://${req.get('host')}${asesoria.imagen}`
        };
      }
      return asesoria;
    });

    res.json(asesoriasConUrlCompleta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Sistema de Asesorías funcionando correctamente ✅');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});