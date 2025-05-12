class Usuario {
  constructor(id, nombre, correo, tipo) {
    this._id = id;
    this._nombre = nombre;
    this._correo = correo;
    this._tipo = tipo; // ya sea tipo asesor , usuario o administrador 
  }

  // Getters
set uuid(value) {
        if (!value) throw new Error("UUID no puede ser nulo o vacío");
        this._uuid = value;
      }
    
      get uuid() {
        return this._uuid;
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
