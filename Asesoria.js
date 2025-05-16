const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const asesoriaSchema = new mongoose.Schema({
    ID_asesoria: {
        type: Number,
        unique: true
    },
    ID_asesor: {
        type: Number,
        ref: 'User',
        required: true,
        validate:{
            validator: async function (ID){
                try {
                    const user = await mongoose.model('User').findOne({ ID_usuario: ID });
                    return !!user; // Simplificamos la validación
                } catch (e) {
                    return false;
                }
            },
            message: 'El ID no corresponde a un asesor'
        }
    },
    materia:{
        type: String, 
        required:true, 
        unique: true
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
    collection: 'asesorias'
});

asesoriaSchema.plugin(AutoIncrement, { 
    inc_field: 'ID_asesoria', 
    startAt: 1 
});

module.exports = mongoose.model('Asesoria', asesoriaSchema);