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

// Configuración simplificada de CORS
const cors = require('cors');
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true
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
    const { materia, descripcion, modalidad, dia, inicio, fin } = req.body;
    if (!materia || !dia || !inicio || !fin || !modalidad) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    const nuevaAsesoria = new Asesoria({
      ID_asesor: req.body.ID_asesor || 1,
      materia,
      descripcion: descripcion || '',
      modalidad,
      dia,
      inicio,
      fin,
      estado: 'confirmada',
      imagen: req.file ? `/public/uploads/${req.file.filename}` : ''
    });
    await nuevaAsesoria.save();
    res.status(201).json(nuevaAsesoria);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const result = await Asesoria.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Asesoría no encontrada' });
    }
    res.json({ 
      success: true,
      id: req.params.id // Asegúrate de devolver el ID eliminado
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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