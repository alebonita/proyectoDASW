'use strict';
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./db");
const User = require("./User"); 
const Asesoria = require("./Asesoria");
const AsesoriaAlumno = require("./AsesoriaAlumno"); // Importamos el nuevo modelo
const AutoIncrement = require('mongoose-sequence')(mongoose);
const app = express();
const port = 8000;
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const cors = require('cors');
app.use(cors({
  origin: '*', // Permitir cualquier origen para pruebas
  credentials: true
})); 

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Crear directorios para imágenes si no existen
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer para guardar imágenes
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
  limits: { fileSize: 5 * 1024 * 1024 }, // Limita a 5MB
  fileFilter: (req, file, cb) => {
    // Acepta solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Conexión a MongoDB
connectDB();

// =========== MODELO DE INSCRIPCIÓN ===========
const inscripcionSchema = new mongoose.Schema({
  ID_alumno: {
    type: String,  // ID del alumno, puede ser ObjectId o String
    required: true
  },
  ID_asesoria: {
    type: Number,  // Cambiado a Number para coincidir con AsesoriaAlumno
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

// Obtener información del usuario actual (simplificado sin JWT)
app.get('/api/usuario-actual', async (req, res) => {
  try {
    // En producción deberías implementar un sistema de sesiones o tokens
    // Por ahora devolvemos un usuario de prueba para que funcione el sistema
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

// Crear nueva asesoría con imagen (sin verificación de token)
app.post('/api/asesorias', upload.single('imagen'), async (req, res) => {
  try {
    console.log("Datos de asesoría recibidos:", req.body);
    const { materia, descripcion, modalidad, dia, inicio, fin } = req.body;
    
    // Validación básica
    if (!materia || !modalidad || !dia || !inicio || !fin) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // Crear nueva asesoría
    const nuevaAsesoria = new Asesoria({
      ID_asesor: req.body.ID_asesor || 1, // Usar valor de la solicitud o 1 como valor predeterminado
      materia,
      descripcion: descripcion || '',
      modalidad,
      dia,
      inicio,
      fin,
      // Si hay una imagen subida, guardar la ruta completa
      imagen: req.file ? `http://localhost:8000/uploads/${req.file.filename}` : null
    });

    const asesoriaGuardada = await nuevaAsesoria.save();
    
    // También crear una copia en AsesoriaAlumno sin usar el mismo ID_asesoria
    // AsesoriaAlumno generará su propio ID_asesoria con autoincremento
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

// Obtener todas las asesorías
app.get('/api/asesorias', async (req, res) => {
  try {
    let query = {};
    
    // Si hay un parámetro de búsqueda
    if (req.query.search) {
      query = {
        $or: [
          { materia: { $regex: req.query.search, $options: 'i' } },
          { descripcion: { $regex: req.query.search, $options: 'i' } }
        ]
      };
    }

    // Filtrar por ID de asesor si se proporciona
    if (req.query.asesor) {
      query.ID_asesor = req.query.asesor;
    }

    // Para depuración: imprimir información
    console.log(`Solicitud de asesorías. Tipo: ${req.query.tipo || 'no especificado'}`);
    
    // Según el tipo de usuario, obtener de una colección diferente
    let asesorias;
    if (req.query.tipo === 'alumno') {
      console.log('Buscando asesorías para alumnos...');
      asesorias = await AsesoriaAlumno.find(query).sort({ ID_asesoria: -1 });
      console.log(`Encontradas ${asesorias.length} asesorías para alumnos`);
    } else {
      // Por defecto, si no se especifica tipo o es diferente a 'alumno', buscar en ambas colecciones
      console.log('Buscando asesorías en ambas colecciones...');
      
      // Primero intentamos en la colección de alumnos (que debería tener todas)
      const asesoriasAlumno = await AsesoriaAlumno.find(query).sort({ ID_asesoria: -1 });
      console.log(`Encontradas ${asesoriasAlumno.length} asesorías en AsesoriaAlumno`);
      
      if (asesoriasAlumno.length > 0) {
        asesorias = asesoriasAlumno;
      } else {
        // Si no hay en AsesoriaAlumno, buscamos en la colección original
        asesorias = await Asesoria.find(query).sort({ _id: -1 });
        console.log(`Encontradas ${asesorias.length} asesorías en Asesoria`);
      }
    }
    
    // Convertir las rutas de imágenes a URL completas
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

// Obtener una asesoría específica
app.get('/api/asesorias/:id', async (req, res) => {
  try {
    let asesoria;
    
    // Intentar buscar por ID_asesoria para AsesoriaAlumno
    if (!isNaN(req.params.id)) {
      asesoria = await AsesoriaAlumno.findOne({ ID_asesoria: parseInt(req.params.id) });
    }
    
    // Si no se encuentra, intentar buscar por _id en Asesoria
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

// Eliminar una asesoría (sin verificación de token)
app.delete('/api/asesorias/:id', async (req, res) => {
  try {
    let asesoria;
    
    // Intentar buscar por ID_asesoria para AsesoriaAlumno
    if (!isNaN(req.params.id)) {
      asesoria = await AsesoriaAlumno.findOne({ ID_asesoria: parseInt(req.params.id) });
      if (asesoria) {
        // Guardar la información de la imagen antes de eliminar
        const imagenUrl = asesoria.imagen;
        await AsesoriaAlumno.deleteOne({ ID_asesoria: parseInt(req.params.id) });
        
        // Eliminar la imagen si existe
        if (imagenUrl) {
          eliminarImagen(imagenUrl);
        }
      }
    }
    
    // También intentar buscar y eliminar por _id en Asesoria
    const asesoriaProfesor = await Asesoria.findById(req.params.id);
    if (asesoriaProfesor) {
      // Guardar la información de la imagen antes de eliminar
      const imagenUrl = asesoriaProfesor.imagen;
      await Asesoria.deleteOne({ _id: req.params.id });
      
      // Eliminar la imagen si existe
      if (imagenUrl) {
        eliminarImagen(imagenUrl);
      }
    }
    
    if (!asesoria && !asesoriaProfesor) {
      return res.status(404).json({ error: 'Asesoría no encontrada' });
    }
    
    res.json({ mensaje: 'Asesoría eliminada correctamente' });
  } catch (error) {
    console.error("Error al eliminar asesoría:", error);
    res.status(500).json({ error: 'Error al eliminar asesoría' });
  }
});

// Función auxiliar para eliminar imágenes
function eliminarImagen(imagenUrl) {
  try {
    // Extraer la ruta relativa de la imagen desde la URL
    let rutaRelativa;
    
    if (imagenUrl.startsWith('http://localhost:8000/')) {
      // Si es una URL completa, extraer la parte después del dominio
      rutaRelativa = imagenUrl.replace('http://localhost:8000/', '');
    } else if (imagenUrl.startsWith('/uploads/')) {
      // Si es una ruta relativa que comienza con /uploads/
      rutaRelativa = imagenUrl.substring(1); // Quitar el slash inicial
    } else if (imagenUrl.startsWith('uploads/')) {
      // Si es una ruta relativa sin slash inicial
      rutaRelativa = imagenUrl;
    } else if (imagenUrl.includes('/uploads/')) {
      // Si es otro formato pero contiene /uploads/
      rutaRelativa = imagenUrl.substring(imagenUrl.indexOf('/uploads/') + 1);
    } else {
      // Si no se reconoce el formato, no hacer nada
      console.log("Formato de URL no reconocido:", imagenUrl);
      return;
    }
    
    // Construir la ruta completa en el sistema de archivos
    const rutaCompleta = path.join(__dirname, 'public', rutaRelativa);
    console.log("Intentando eliminar archivo:", rutaCompleta);
    
    // Verificar si el archivo existe antes de eliminarlo
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

// Crear nueva asesoría de prueba
app.post('/api/asesorias/test', async (req, res) => {
  try {
    // Crear una asesoría de prueba
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

// Crear una nueva inscripción - versión simplificada
app.post('/api/inscripciones', async (req, res) => {
  try {
    console.log("Datos recibidos para inscripción:", req.body);
    const { ID_alumno, ID_asesoria } = req.body;
    
    // Validar que exista el alumno y la asesoría
    if (!ID_alumno || !ID_asesoria) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    // Verificar si ya existe una inscripción activa - usamos IDs como string para comparación
    const inscripcionExistente = await Inscripcion.findOne({
      ID_alumno: ID_alumno.toString(),
      ID_asesoria: ID_asesoria.toString(),
      estado: 'inscrito'
    });
    
    if (inscripcionExistente) {
      return res.status(400).json({ error: 'Ya estás inscrito en esta asesoría' });
    }
    
    // Crear nueva inscripción
    const nuevaInscripcion = new Inscripcion({
      ID_alumno: ID_alumno.toString(),
      ID_asesoria: ID_asesoria.toString(),
      estado: 'inscrito'
    });
    
    await nuevaInscripcion.save();
    console.log("Inscripción guardada:", nuevaInscripcion);
    
    // Simplificamos la respuesta para evitar problemas
    res.status(201).json({
      _id: nuevaInscripcion._id,
      mensaje: 'Inscripción creada correctamente'
    });
    
  } catch (error) {
    console.error("Error al crear inscripción:", error);
    res.status(500).json({ error: 'Error al crear inscripción: ' + error.message });
  }
});

// Obtener inscripciones de un alumno - versión mejorada con más logs
app.get('/api/inscripciones/alumno/:alumnoId', async (req, res) => {
  try {
    const alumnoId = req.params.alumnoId;
    console.log("Buscando inscripciones para alumno:", alumnoId);
    
    // Buscar todas las inscripciones activas del alumno
    const inscripciones = await Inscripcion.find({
      ID_alumno: alumnoId.toString(),
      estado: 'inscrito'
    });
    
    console.log(`Encontradas ${inscripciones.length} inscripciones para el alumno ${alumnoId}`);
    inscripciones.forEach(insc => {
      console.log(`  - Inscripción: ${insc._id}, Asesoría: ${insc.ID_asesoria}, Estado: ${insc.estado}`);
    });
    
    // Resultado que incluiremos en la respuesta
    const resultado = [];
    
    // Para cada inscripción, intentar encontrar la asesoría correspondiente
    for (const inscripcion of inscripciones) {
      // Buscamos primero en Asesoria (usando MongoDB ObjectId)
      let asesoria = null;
      
      // Si parece un ObjectId de MongoDB
      if (inscripcion.ID_asesoria.length === 24) {
        try {
          console.log(`Buscando asesoría con _id: ${inscripcion.ID_asesoria}`);
          asesoria = await Asesoria.findById(inscripcion.ID_asesoria);
        } catch (error) {
          console.log(`Error al buscar asesoría por _id ${inscripcion.ID_asesoria}:`, error.message);
        }
      }
      
      // Si no encontramos por _id, intentamos con ID_asesoria numérico
      if (!asesoria && !isNaN(inscripcion.ID_asesoria)) {
        try {
          console.log(`Buscando asesoría con ID_asesoria: ${inscripcion.ID_asesoria}`);
          asesoria = await AsesoriaAlumno.findOne({ ID_asesoria: Number(inscripcion.ID_asesoria) });
        } catch (error) {
          console.log(`Error al buscar en AsesoriaAlumno con ID ${inscripcion.ID_asesoria}:`, error.message);
        }
      }
      
      // Si aún no encontramos, intentamos un último enfoque con la colección Asesoria
      if (!asesoria) {
        try {
          console.log("Intentando búsqueda alternativa en Asesoria");
          // Buscar todas las asesorías - esto es un enfoque de último recurso
          const todasAsesorias = await Asesoria.find({});
          console.log(`Encontradas ${todasAsesorias.length} asesorías en total`);
          
          // Buscar una que coincida con el ID_asesoria como string
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
      
      // Si encontramos la asesoría, la agregamos al resultado
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

// Cancelar inscripción
app.delete('/api/inscripciones/:inscripcionId', async (req, res) => {
  try {
    const inscripcionId = req.params.inscripcionId;
    
    const inscripcion = await Inscripcion.findById(inscripcionId);
    
    if (!inscripcion) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }
    
    // Actualizamos el estado a 'cancelado'
    inscripcion.estado = 'cancelado';
    await inscripcion.save();
    
    res.json({ mensaje: 'Inscripción cancelada correctamente' });
    
  } catch (error) {
    console.error("Error al cancelar inscripción:", error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta básica
app.get('/', (req, res) => res.send('Sistema de Asesorías'));

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});