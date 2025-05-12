import Usuario from './Usuario.js';
import { guardarEnStorage, obtenerDeStorage } from './storage.js';

export default class Alumno extends Usuario {
  constructor(id, nombre, correo) {
    super(id, nombre, correo, 'alumno');
    this._asesoriasInscritas = []; // Array de IDs de asesorías
    this._comentarios = []; // { idAsesoria, texto, calificación }
  }

  // --- Getters ---
  get asesoriasInscritas() {
    return this._asesoriasInscritas;
  }

  get comentarios() {
    return this._comentarios;
  }

  // --- Métodos públicos ---
  inscribirEnAsesoria(idAsesoria) {
    if (!this._asesoriasInscritas.includes(idAsesoria)) {
      this._asesoriasInscritas.push(idAsesoria);
      this._guardarDatos();
      return true;
    }
    return false; // Ya estaba inscrito
  }

  cancelarAsesoria(idAsesoria) {
    this._asesoriasInscritas = this._asesoriasInscritas.filter(id => id !== idAsesoria);
    this._guardarDatos();
  }

  agregarComentario(idAsesoria, texto, calificacion) {
    this._comentarios.push({ idAsesoria, texto, calificacion });
    this._guardarDatos();
  }

  // --- Privados ---
  _guardarDatos() {
    const alumnos = obtenerDeStorage('alumnos') || {};
    alumnos[this._id] = {
      asesoriasInscritas: this._asesoriasInscritas,
      comentarios: this._comentarios
    };
    guardarEnStorage('alumnos', alumnos);
  }

  // Cargar datos desde localStorage (llamar al iniciar sesión)
  static cargarDatos(idAlumno) {
    const alumnos = obtenerDeStorage('alumnos') || {};
    return alumnos[idAlumno] || { asesoriasInscritas: [], comentarios: [] };
  }
}