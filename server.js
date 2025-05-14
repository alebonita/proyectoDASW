'use strict';
const express = require("express");
const mongoose = require("mongoose"); // Añadido
const connectDB = require("./db");
const User = require("./User"); // Importamos el modelo User
const app = express();
const port = 8000;

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
      contra: contrasena,
      tipo_usuario: tipo_usuario || 'alumno' // Valor por defecto
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(400).json({ error: error.message });
  }
});

// Ruta básica
app.get('/', (req, res) => res.send('Sistema de Asesorías'));

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});