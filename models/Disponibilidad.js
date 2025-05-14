const mongoose = require('mongoose');
const { AutoIncrement } = require('@typegoose/auto-increment');

const disponibilidadSchema = new mongoose.Schema({
    ID_disponibilidad: {
        type: Number,
        unique: true
    },
    ID_usuario:{
        type: Number,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(ID){
                const user = await mongoose.model('User').findOne({ID_usuario : ID});
                return user && user.tipo_usuario === 'asesor';
            },
            message: 'El ID no es correcto'
        }
    },
    ID_horario: {
        type: Number,
        ref: 'Horario',
        required: true
    },
    disponible: {
        type: Boolean,
        default: true
    }
});

disponibilidadSchema.plugin(AutoIncrement, {field:'ID_disponibilidad', startAt: 1});
module.exports = mongoose.model('Disponibilidad', disponibilidadSchema);