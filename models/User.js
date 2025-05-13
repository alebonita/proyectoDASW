const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nombre: {type: String, required:true},
    correo: {type: String, required: true, unique:true},
    contra: {type: String, required: true},
    tipo_usuario: {type: String, enum:['alumno', 'asesor', 'admin'], default: 'alumno'},
});

userSchema.pre('save', async function (next) {
    if(!this.isModified('contra')) return next();
    this.contra = await bcrypt.hash(this.contra, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);