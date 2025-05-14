const mongoose = require('mongoose');
const { AutoIncrement } = require('@typegoose/auto-increment');

const evaluacionSchema = new mongoose.Schema({
    ID_evaluacion: {
        type: Number,
        unique: true
    },
    ID_asesor:{
        type: Number,
        ref: 'User',
        required: true,
        validate:{
            validator: async function(ID){
                const user = await mongoose.model('User').findOne({ID_usuario: ID});
                return user && user.tipo_usuario === 'asesor';
            },
            message: 'El ID no es válido'
        }
    },
    ID_alumno:{
        type: Number, 
        ref: 'User',
        required: true,
        validate:{
            validator: async function(ID){
                const user = await mongoose.model('User').findOne({ID_usuario:ID});
                return user && user.tipo_usuario === 'alumno';
            },
            message: 'El ID no es válido'
        }
    },
    calificacion: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comentario:{
        type: String,
        trim: true
    }
});

evaluacionSchema.plugin(AutoIncrement, {field: 'ID_evaluación', startAt: 1});
module.exports = mongoose.model('Evaluación', evaluacionSchema);