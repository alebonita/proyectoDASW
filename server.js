'use strict';
const express = require("express");
const mongoose = require("mongoose"); // Añadido
const connectDB = require("./db");
const User = require("./User"); // Importamos el modelo User
const app = express();
const port = 8000;
const bcrypt = require('bcryptjs');

const cors = require('cors');
app.use(cors()); 

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para formularios HTML

// Conexión a MongoDB (usamos db.js)
connectDB();

// Ruta de registro
app.post('/api/registrar', async (req, res) => {
  console.log("Datos recibidos:", req.body);
  try {
    const { nombre, correo, contrasena, tipo_usuario } = req.body;
    const nuevoUsuario = new User({
      nombre,
      correo,
      contrasena,
      tipo_usuario: tipo_usuario || 'alumno' // Valor por defecto
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const usuario = await User.findOne({ correo }).select('+contrasena');

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Devuelve el usuario SIN la contraseña
    const usuarioSinContra = usuario.toObject();
    delete usuarioSinContra.contrasena;
    
    res.json(usuarioSinContra);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta básica
app.get('/', (req, res) => res.send('Sistema de Asesorías'));

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});