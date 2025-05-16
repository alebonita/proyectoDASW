const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
    ID_usuario:{
        type: Number, 
        unique:true
    },
    nombre: {
        type: String, 
        required:true, 
        trim: true, 
        maxlength:100
    },
    correo: {
        type: String,
        required: true,
        unique:true,
        lowercase:true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Correo inválido']
    },
    contra: {
        type: String, 
        required: true,
        minlength: 6,
        select: false
    },
    tipo_usuario: {
        type: String,
        enum:['alumno', 'asesor', 'admin'],
        default: 'alumno',
    }, 
},
{ 
    collection: 'users'
});

userSchema.methods.comparePassword = async function(contra) {
    return await bcrypt.compare(contra, this.contra);
};

userSchema.plugin(AutoIncrement, { 
    inc_field: 'ID_usuario', 
    startAt: 1 
});

userSchema.pre('save', async function (next) {
    if(!this.isModified('contra')) return next();
    this.contra = await bcrypt.hash(this.contra, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);
