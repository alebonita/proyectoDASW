const mongoose = require('mongoose');
const { AutoIncrement } = require('@typegoose/auto-increment');
const { validate } = require('./User');

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
                const user = await mongoose.model('User').findOne({ID_usuario: ID});
                return user && user.tipo_usuario === 'asesor';
            },
            message: 'El ID no corresponde a un asesor'
        }
    },
    ID_materia: {
        type: Number, 
        ref: 'Materia',
        required: true
    },
    ID_horario: {
        type : Number,
        ref: 'Horario',
        required: true
    },
    modalidad:{
        type: String,
        enum: ['presencial', 'virtual'],
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmada', 'cancelada'],
        default: 'pendiente'
    }
});

asesoriaSchema.plugin(AutoIncrement, {field: 'ID_asesoria', startAt: 1});
module.exports = mongoose.model('Asesoria', asesoriaSchema);