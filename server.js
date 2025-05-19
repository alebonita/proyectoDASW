'use strict';

require('dotenv').config(); // Añadido para manejo de variables de entorno
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./db");
const User = require("./User"); 
const Asesoria = require("./Asesoria");
const AsesoriaAlumno = require("./AsesoriaAlumno"); 
const AutoIncrement = require('mongoose-sequence')(mongoose);
const app = express();
const port = process.env.PORT || 8000; // Modificado para Render
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-app-frontend.onrender.com'] 
    : '*',
  credentials: true
})); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de subida de archivos
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Conexión a MongoDB con manejo mejorado de errores
connectDB()
  .then(() => console.log('MongoDB conectado exitosamente'))
  .catch(err => {
    console.error('Error de conexión a MongoDB:', err);
    process.exit(1);
  });

// =========== MODELO DE INSCRIPCIÓN ===========
const inscripcionSchema = new mongoose.Schema({
  ID_alumno: {
    type: String,  
    required: true
  },
  ID_asesoria: {
    type: Number,  
    required: true
  },
  estado: {
    type: String,
    enum: ['inscrito', 'cancelado', 'finalizado'],
    default: 'inscrito'
  },
  fecha_inscripcion: {
    type: Date,
    default: Date.now
  }
});

const Inscripcion = mongoose.model('Inscripcion', inscripcionSchema);
// =========== RUTAS DE AUTENTICACIÓN ===========

app.post('/api/registrar', async (req, res) => {
  console.log("Datos recibidos:", req.body);
  try {
    const { nombre, correo, contrasena, tipo_usuario } = req.body;
    const nuevoUsuario = new User({
      nombre,
      correo,
      contrasena,
      tipo_usuario: tipo_usuario || 'alumno' 
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

    const usuarioSinContra = usuario.toObject();
    delete usuarioSinContra.contrasena;
    
    res.json(usuarioSinContra);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/api/usuario-actual', async (req, res) => {
  try {

    res.json({
      id: '1',
      nombre: 'Usuario de Prueba',
      correo: 'usuario@example.com',
      tipo_usuario: 'alumno'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// =========== RUTAS PARA ASESORÍAS (PROFESOR) ===========

app.post('/api/asesorias', upload.single('imagen'), async (req, res) => {
  try {
    console.log("Datos de asesoría recibidos:", req.body);
    const { materia, descripcion, modalidad, dia, inicio, fin } = req.body;
    
    if (!materia || !modalidad || !dia || !inicio || !fin) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const nuevaAsesoria = new Asesoria({
      ID_asesor: req.body.ID_asesor || 1, 
      materia,
      descripcion: descripcion || '',
      modalidad,
      dia,
      inicio,
      fin,
      imagen: req.file ? `http://localhost:8000/uploads/${req.file.filename}` : null
    });

    const asesoriaGuardada = await nuevaAsesoria.save();
    
    const nuevaAsesoriaAlumno = new AsesoriaAlumno({
      materia,
      descripcion: descripcion || '',
      modalidad,
      dia,
      inicio,
      fin,
      imagen: req.file ? `http://localhost:8000/uploads/${req.file.filename}` : null
    });
    
    await nuevaAsesoriaAlumno.save();
    
    console.log("Asesoría guardada correctamente:", asesoriaGuardada);
    res.status(201).json(asesoriaGuardada);
  } catch (error) {
    console.error("Error al crear asesoría:", error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/asesorias', async (req, res) => {
  try {
    let query = {};
    
    if (req.query.search) {
      query = {
        $or: [
          { materia: { $regex: req.query.search, $options: 'i' } },
          { descripcion: { $regex: req.query.search, $options: 'i' } }
        ]
      };
    }

    if (req.query.asesor) {
      query.ID_asesor = req.query.asesor;
    }

    console.log(`Solicitud de asesorías. Tipo: ${req.query.tipo || 'no especificado'}`);

    let asesorias;
    if (req.query.tipo === 'alumno') {
      console.log('Buscando asesorías para alumnos...');
      asesorias = await AsesoriaAlumno.find(query).sort({ ID_asesoria: -1 });
      console.log(`Encontradas ${asesorias.length} asesorías para alumnos`);
    } else {

      const asesoriasAlumno = await AsesoriaAlumno.find(query).sort({ ID_asesoria: -1 });
      console.log(`Encontradas ${asesoriasAlumno.length} asesorías en AsesoriaAlumno`);
      
      if (asesoriasAlumno.length > 0) {
        asesorias = asesoriasAlumno;
      } else {
        asesorias = await Asesoria.find(query).sort({ _id: -1 });
        console.log(`Encontradas ${asesorias.length} asesorías en Asesoria`);
      }
    }

    const asesoriasConImagenes = asesorias.map(a => {
      const asesoria = a.toObject();
      if (asesoria.imagen && !asesoria.imagen.startsWith('http')) {
        asesoria.imagen = `http://localhost:8000${asesoria.imagen}`;
      }
      return asesoria;
    });
    
    res.json(asesoriasConImagenes);
  } catch (error) {
    console.error("Error al obtener asesorías:", error);
    res.status(500).json({ error: 'Error al obtener asesorías: ' + error.message });
  }
});


app.get('/api/asesorias/:id', async (req, res) => {
  try {
    let asesoria;
    

    if (!isNaN(req.params.id)) {
      asesoria = await AsesoriaAlumno.findOne({ ID_asesoria: parseInt(req.params.id) });
    }

    if (!asesoria) {
      asesoria = await Asesoria.findById(req.params.id);
    }
    
    if (!asesoria) {
      return res.status(404).json({ error: 'Asesoría no encontrada' });
    }
    
    res.json(asesoria);
  } catch (error) {
    console.error("Error al obtener asesoría:", error);
    res.status(500).json({ error: 'Error al obtener asesoría' });
  }
});

app.delete('/api/asesorias/:id', async (req, res) => {
  try {
    console.log(`Intentando eliminar asesoría con ID: ${req.params.id}`);
    let eliminadaEnColeccionAlumno = false;
    let eliminadaEnColeccionAsesor = false;
    let imagenUrl = null;
    
    if (!isNaN(req.params.id)) {
      console.log(`Buscando en AsesoriaAlumno con ID_asesoria: ${parseInt(req.params.id)}`);
      const asesoria = await AsesoriaAlumno.findOne({ ID_asesoria: parseInt(req.params.id) });
      if (asesoria) {
        imagenUrl = asesoria.imagen;
        console.log(`Eliminando de AsesoriaAlumno con ID_asesoria: ${parseInt(req.params.id)}`);
        const resultadoAlumno = await AsesoriaAlumno.deleteOne({ ID_asesoria: parseInt(req.params.id) });
        console.log(`Resultado eliminación AsesoriaAlumno:`, resultadoAlumno);
        eliminadaEnColeccionAlumno = resultadoAlumno.deletedCount > 0;
      }
    }
    
    try {
      console.log(`Buscando en Asesoria con _id: ${req.params.id}`);
      const asesoriaProfesor = await Asesoria.findById(req.params.id);
      
      if (asesoriaProfesor) {
        if (!imagenUrl) {
          imagenUrl = asesoriaProfesor.imagen;
        }
        
        console.log(`Eliminando de Asesoria con _id: ${req.params.id}`);
        const resultadoAsesor = await Asesoria.findByIdAndDelete(req.params.id);
        console.log(`Resultado eliminación Asesoria:`, resultadoAsesor ? "Eliminado" : "No eliminado");
        eliminadaEnColeccionAsesor = !!resultadoAsesor;
      }
    } catch (error) {
      console.error("Error al buscar/eliminar en Asesoria:", error);
    }
    
    if (imagenUrl && (eliminadaEnColeccionAlumno || eliminadaEnColeccionAsesor)) {
      eliminarImagen(imagenUrl);
    }
    
    if (!eliminadaEnColeccionAlumno && !eliminadaEnColeccionAsesor) {
      return res.status(404).json({ 
        error: 'Asesoría no encontrada', 
        coleccionAlumno: eliminadaEnColeccionAlumno,
        coleccionAsesor: eliminadaEnColeccionAsesor
      });
    }
    
    res.json({ 
      mensaje: 'Asesoría eliminada correctamente',
      coleccionAlumno: eliminadaEnColeccionAlumno,
      coleccionAsesor: eliminadaEnColeccionAsesor
    });
  } catch (error) {
    console.error("Error al eliminar asesoría:", error);
    res.status(500).json({ error: 'Error al eliminar asesoría: ' + error.message });
  }
});

function eliminarImagen(imagenUrl) {
  try {

    let rutaRelativa;
    
    if (imagenUrl.startsWith('http://localhost:8000/')) {

      rutaRelativa = imagenUrl.replace('http://localhost:8000/', '');
    } else if (imagenUrl.startsWith('/uploads/')) {

      rutaRelativa = imagenUrl.substring(1); 
    } else if (imagenUrl.startsWith('uploads/')) {

      rutaRelativa = imagenUrl;
    } else if (imagenUrl.includes('/uploads/')) {

      rutaRelativa = imagenUrl.substring(imagenUrl.indexOf('/uploads/') + 1);
    } else {

      console.log("Formato de URL no reconocido:", imagenUrl);
      return;
    }

    const rutaCompleta = path.join(__dirname, 'public', rutaRelativa);
    console.log("Intentando eliminar archivo:", rutaCompleta);
    
    if (fs.existsSync(rutaCompleta)) {
      fs.unlinkSync(rutaCompleta);
      console.log("Archivo eliminado con éxito:", rutaCompleta);
    } else {
      console.log("El archivo no existe en el sistema:", rutaCompleta);
    }
  } catch (error) {
    console.error("Error al eliminar la imagen:", error.message);
  }
}

// =========== RUTAS PARA ASESORÍAS (ALUMNO) ===========

app.post('/api/asesorias/test', async (req, res) => {
  try {

    const nuevaAsesoria = new AsesoriaAlumno({
      materia: "Matemáticas de prueba",
      descripcion: "Descripción de prueba",
      modalidad: "presencial",
      dia: "Lunes",
      inicio: "15:00",
      fin: "16:00",
      estado: "pendiente",
      imagen: "https://via.placeholder.com/150?text=Matematicas"
    });

    await nuevaAsesoria.save();
    res.status(201).json(nuevaAsesoria);
  } catch (error) {
    console.error("Error al crear asesoría:", error);
    res.status(400).json({ error: error.message });
  }
});

// =========== RUTAS PARA INSCRIPCIONES ===========

app.post('/api/inscripciones', async (req, res) => {
  try {
    console.log("Datos recibidos para inscripción:", req.body);
    const { ID_alumno, ID_asesoria } = req.body;
    
    if (!ID_alumno || !ID_asesoria) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    const inscripcionExistente = await Inscripcion.findOne({
      ID_alumno: ID_alumno.toString(),
      ID_asesoria: ID_asesoria.toString(),
      estado: 'inscrito'
    });
    
    if (inscripcionExistente) {
      return res.status(400).json({ error: 'Ya estás inscrito en esta asesoría' });
    }

    const nuevaInscripcion = new Inscripcion({
      ID_alumno: ID_alumno.toString(),
      ID_asesoria: ID_asesoria.toString(),
      estado: 'inscrito'
    });
    
    await nuevaInscripcion.save();
    console.log("Inscripción guardada:", nuevaInscripcion);

    res.status(201).json({
      _id: nuevaInscripcion._id,
      mensaje: 'Inscripción creada correctamente'
    });
    
  } catch (error) {
    console.error("Error al crear inscripción:", error);
    res.status(500).json({ error: 'Error al crear inscripción: ' + error.message });
  }
});

app.get('/api/inscripciones/alumno/:alumnoId', async (req, res) => {
  try {
    const alumnoId = req.params.alumnoId;
    console.log("Buscando inscripciones para alumno:", alumnoId);
 
    const inscripciones = await Inscripcion.find({
      ID_alumno: alumnoId.toString(),
      estado: 'inscrito'
    });
    
    console.log(`Encontradas ${inscripciones.length} inscripciones para el alumno ${alumnoId}`);
    inscripciones.forEach(insc => {
      console.log(`  - Inscripción: ${insc._id}, Asesoría: ${insc.ID_asesoria}, Estado: ${insc.estado}`);
    });

    const resultado = [];

    for (const inscripcion of inscripciones) {
      let asesoria = null;

      if (inscripcion.ID_asesoria.length === 24) {
        try {
          console.log(`Buscando asesoría con _id: ${inscripcion.ID_asesoria}`);
          asesoria = await Asesoria.findById(inscripcion.ID_asesoria);
        } catch (error) {
          console.log(`Error al buscar asesoría por _id ${inscripcion.ID_asesoria}:`, error.message);
        }
      }

      if (!asesoria && !isNaN(inscripcion.ID_asesoria)) {
        try {
          console.log(`Buscando asesoría con ID_asesoria: ${inscripcion.ID_asesoria}`);
          asesoria = await AsesoriaAlumno.findOne({ ID_asesoria: Number(inscripcion.ID_asesoria) });
        } catch (error) {
          console.log(`Error al buscar en AsesoriaAlumno con ID ${inscripcion.ID_asesoria}:`, error.message);
        }
      }

      if (!asesoria) {
        try {
          console.log("Intentando búsqueda alternativa en Asesoria");

          const todasAsesorias = await Asesoria.find({});
          console.log(`Encontradas ${todasAsesorias.length} asesorías en total`);

          for (const a of todasAsesorias) {
            if (a._id.toString() === inscripcion.ID_asesoria || 
                (a.ID_asesoria && a.ID_asesoria.toString() === inscripcion.ID_asesoria)) {
              asesoria = a;
              console.log("¡Encontrada asesoría mediante búsqueda alternativa!");
              break;
            }
          }
        } catch (error) {
          console.log("Error en búsqueda alternativa:", error.message);
        }
      }

      if (asesoria) {
        console.log(`Asesoría encontrada: ${asesoria.materia}`);
        resultado.push({
          id: inscripcion._id,
          asesoria: asesoria
        });
      } else {
        console.log(`No se encontró ninguna asesoría para el ID ${inscripcion.ID_asesoria}`);
      }
    }
    
    console.log(`Enviando ${resultado.length} inscripciones al cliente`);
    res.json(resultado);
    
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({ error: 'Error al obtener inscripciones: ' + error.message });
  }
});

app.delete('/api/inscripciones/:inscripcionId', async (req, res) => {
  try {
    const inscripcionId = req.params.inscripcionId;
    
    const inscripcion = await Inscripcion.findById(inscripcionId);
    
    if (!inscripcion) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    inscripcion.estado = 'cancelado';
    await inscripcion.save();
    
    res.json({ mensaje: 'Inscripción cancelada correctamente' });
    
  } catch (error) {
    console.error("Error al cancelar inscripción:", error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/', (req, res) => res.send('Sistema de Asesorías'));

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date()
  });
});

// Ruta principal mejorada
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Asesorías Académicas',
    environment: process.env.NODE_ENV || 'development',
    api_docs: '/api',
    health_check: '/health'
  });
});

// Manejador de errores mejorado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo salió mal en el servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Iniciar servidor con manejo mejorado
const server = app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre para producción
process.on('SIGTERM', () => {
  console.log('Recibido SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    mongoose.connection.close(false, () => {
      console.log('Conexión a MongoDB cerrada');
      process.exit(0);
    });
  });
});