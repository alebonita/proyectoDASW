const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const asesoriaAlumnoSchema = new mongoose.Schema({
    ID_asesoria: {
        type: Number,
        unique: true
    },
    materia:{
        type: String, 
        required:true,
        // Removemos unique para evitar errores en pruebas
        unique: false
    },
    descripcion: {
        type: String
    },
    modalidad:{
        type: String,
        enum: ['presencial', 'virtual'],
        required: true
    },
    dia: {
        type: String,
        enum: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        required: true,
    },
    inicio: {
        type: String,
        required: true
    },
    fin: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmada', 'cancelada'],
        default: 'pendiente'
    },
    imagen: {
        type: String,
        required: false,
        trim: true,
    }
},
{ 
    collection: 'asesoriasAlumno'
});

// Usamos un nombre diferente para el contador: 'asesoria_alumno_counter'
asesoriaAlumnoSchema.plugin(AutoIncrement, { 
    inc_field: 'ID_asesoria', 
    startAt: 1,
    id: 'asesoria_alumno_counter' // Nombre único para este contador
});

// Nombramos el modelo como 'AsesoriaAlumno' para diferenciarlo de 'Asesoria'
module.exports = mongoose.model('AsesoriaAlumno', asesoriaAlumnoSchema);