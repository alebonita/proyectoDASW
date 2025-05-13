const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
    nombre:{type: String, required:true, unique: true},
    descripcion: {type: String},
});

module.exports = mongoose.model('Materia', materiaSchema);