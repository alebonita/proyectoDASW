'use strict'
const express= require("express");
const app= express();
const port=8000;

app.use(express.json());// Usa express body-parse para parsiar todos los cuerpos requeridos
app.get('/',
    (req, res) => res.send('Asesorias ')
  );
  app.listen(port, () => {
    console.log(`Pro  app listening on port ${port}!`);
  })
