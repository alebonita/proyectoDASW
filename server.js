'use strict'
const express= require("express");
const mongoose = require("mongoose");
const app= express();
const port=8000;

const mongoUrl = "mongodb+srv://admin:Asesorias2025@bdprueba.27ltjcv.mongodb.net/";

mongoose.connect(mongoUrl)
.then (() => console.log("Conectado a MongoDB "))
.catch(err => console.error("Error de conexión", err));

app.use(express.json());// Usa express body-parse para parsiar todos los cuerpos requeridos
app.get('/',
    (req, res) => res.send('Asesorias ')
  );
  app.listen(port, () => {
    console.log(`Pro  app listening on port ${port}!`);
  })
