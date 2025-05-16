'use strict';
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./User');
const Asesoria = require('./Asesoria');
const app = express();
const port = 8000;
const bcrypt = require('bcryptjs');
const path = require('path');

const fs = require('fs').promises;

// Helper para borrar archivos físicos
async function deleteFile(path) {
  try {
    await fs.unlink(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Solo mostramos el error si NO es "archivo no existe"
      console.error("Error al borrar el archivo:", error);
    }
    // si es ENOENT, lo ignoramos
  }
}

// Configuración simplificada de CORS
const cors = require('cors');
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true,
   methods: ['GET', 'POST', 'DELETE'] 
}));

// Middlewares esenciales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
connectDB();

// Configuración de Multer (versión simplificada)
const multer = require('multer');
const upload = multer({ 
  dest: path.join(__dirname, 'public', 'uploads')
});

// Rutas estáticas
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rutas de API
app.post('/api/registrar', async (req, res) => {
  try {
    const { nombre, correo, contrasena, tipo_usuario } = req.body;
    const nuevoUsuario = new User({
      nombre,
      correo,
      contra: await bcrypt.hash(contrasena, 10),
      tipo_usuario: tipo_usuario || 'alumno'
    });
    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado exitosamente" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { correo, contra } = req.body;
    const usuario = await User.findOne({ correo }).select('+contra');
    if (!usuario || !(await bcrypt.compare(contra, usuario.contra))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const usuarioSinContra = usuario.toObject();
    delete usuarioSinContra.contra;
    res.json(usuarioSinContra);
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/asesorias', upload.single('imagen'), async (req, res) => {
  try {
    const { ID_asesor, materia, modalidad, dia, inicio, fin } = req.body;

    // Validación básica
    if (!ID_asesor || !materia || !modalidad || !dia || !inicio || !fin) {
      // Si se subió un archivo pero faltan campos, bórralo para evitar basura
      if (req.file) await deleteFile(req.file.path);
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const nuevaAsesoria = new Asesoria({
      ID_asesor,
      materia,
      modalidad,
      dia,
      inicio,
      fin,
      imagen: req.file ? `/public/uploads/${req.file.filename}` : null, // Usa null si no hay imagen
    });

    await nuevaAsesoria.save();
    res.status(200).json({ mensaje: 'Asesoría creada correctamente', asesoría: nuevaAsesoria });

  } catch (error) {
      res.status(500).json({ 
          success: false,
          error: error.message 
        });
  }
});

app.get('/api/asesorias', async (req, res) => {
  try {
    const asesorias = await Asesoria.find();
    res.json(asesorias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener asesorías" });
  }
});

app.delete('/api/asesorias/:id', async (req, res) => {
  try {
    const asesoria = await Asesoria.findById(req.params.id);
    if (!asesoria) {
      return res.status(404).json({ error: 'Asesoría no encontrada' });
    }

    // Borra la imagen física si existe
    if (asesoria.imagen) {
      await deleteFile(asesoria.imagen.replace('/public', 'public'));
    }

    await Asesoria.findByIdAndDelete(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para servir imágenes (versión simplificada)
app.get('/public/uploads/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'uploads', req.params.file));
});

app.get('/api/usuario-actual', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    
    // Devuelve solo los datos necesarios del usuario
    const userData = {
        _id: req.user._id,
        nombre: req.user.nombre,
        correo: req.user.correo,
        tipo_usuario: req.user.tipo_usuario
    };
    res.json(userData);
});

// Ruta de salud
app.get('/', (req, res) => res.send('Sistema de Asesorías - OK'));

// Inicio del servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});