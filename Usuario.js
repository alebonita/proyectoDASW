export default class Usuario {
  constructor(id, nombre, correo, tipo) {
    this._id = id;
    this._nombre = nombre;
    this._correo = correo;
    this._tipo = tipo; // 'admin', 'asesor', 'alumno'
  }

  // Getters
  get id() {
    return this._id;
  }

  get nombre() {
    return this._nombre;
  }

  get correo() {
    return this._correo;
  }

  get tipo() {
    return this._tipo;
  }

  // Setters
  set nombre(nuevoNombre) {
    this._nombre = nuevoNombre;
  }

  set correo(nuevoCorreo) {
    if (nuevoCorreo.includes('@')) {
      this._correo = nuevoCorreo;
    } else {
      console.error('Correo inválido');
    }
  }
}