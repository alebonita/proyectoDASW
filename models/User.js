const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {AutoIncrement} = require('typegoose/auto-increment');

const userSchema = new mongoose.Schema({
    ID_usuario:{
        type: Number, 
        unique:true
    },
    nombre: {
        type: String, 
        required:[true, 'Nombre obligatorio'], 
        trim: true, 
        maxlength:[100,'Nombre inválido']
    },
    correo: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique:true,
        lowercase:true,
        trim: true,
        validate:{
            validator: (email) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email),
        }
    },
    contra: {type: String, required: true},
    tipo_usuario: {type: String, enum:['alumno', 'asesor', 'admin'], default: 'alumno'},
});

userSchema.pre('save', async function (next) {
    if(!this.isModified('contra')) return next();
    this.contra = await bcrypt.hash(this.contra, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);