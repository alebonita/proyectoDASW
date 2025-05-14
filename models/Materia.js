const mongoose = require('mongoose');
const { AutoIncrement } = require('@typegoose/auto-increment');

const materiaSchema = new mongoose.Schema({
    ID_materia: {
        type: Number,
        unique: true
    },
    nombre:{
        type: String, 
        required:true, 
        unique: true
    },
    descripcion: {
        type: String
    },
});

materiaSchema.plugin(AutoIncrement, {field: 'ID_materia', startAt: 1});
module.exports = mongoose.model('Materia', materiaSchema);