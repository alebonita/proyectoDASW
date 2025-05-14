const mongoose = require('mongoose');
const { AutoIncrement } = require('@typegoose/auto-increment');

const horarioSchema = new mongoose.Schema({
    ID_horario:{
        type: Number,
        unique: true
    },
    dia: {
        type: String,
        enum: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        required: true,
    },
    horario_inicio: {
        type: String,
        required: true
    },
    hora_fin: {
        type: String,
        required: true
    }
});

horarioSchema.plugin(AutoIncrement, {field: 'ID_horario', startAt: 1});
module.exports = mongoose.model('Horario', horarioSchema);
