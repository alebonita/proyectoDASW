import Usuario from './Usuario.js';
import { guardarEnStorage, obtenerDeStorage } from './storage.js';

class Asesor extends Usuario {
  constructor(id, nombre, correo, materias = []) {
    super(id, nombre, correo, 'asesor');
    this._materias = materias; 
    this._asesoriasCreadas = []; // Array de IDs de asesorías
  }

  // Getters 
  get materias() {  
    return this._materias;
  }

  get asesoriasCreadas() {
    return this._asesoriasCreadas;
  }

  // Setters 
  set materias(nuevasMaterias) {
    this._materias = nuevasMaterias;
    this._guardarDatos();
  }
/// prueba de git

  // Métodos públicos
  crearAsesoria(materia, horario, cupo, modalidad = "Presencial") {
    const nuevaAsesoria = {
      id: `AS-${Date.now()}`,
      materia,
      horario,
      cupo,
      modalidad,
      asesorId: this._id,
      asesorNombre: this._nombre
    };

    this._asesoriasCreadas.push(nuevaAsesoria.id);
    this._guardarDatos();

    // Guardar la asesoría en el storage general
    const asesorias = obtenerDeStorage('asesorias') || [];
    asesorias.push(nuevaAsesoria);
    guardarEnStorage('asesorias', asesorias);

    return nuevaAsesoria;
  }

  cancelarAsesoria(idAsesoria) {
    this._asesoriasCreadas = this._asesoriasCreadas.filter(id => id !== idAsesoria);
    this._guardarDatos();

    //  Marcar como cancelada en el storage general
    const asesorias = obtenerDeStorage('asesorias') || [];
    const asesoria = asesorias.find(a => a.id === idAsesoria);
    if (asesoria) asesoria.estado = "Cancelada";
    guardarEnStorage('asesorias', asesorias);
  }

  //  Privados
  _guardarDatos() {
    const asesores = obtenerDeStorage('asesores') || {};
    asesores[this._id] = {
      materias: this._materias,
      asesoriasCreadas: this._asesoriasCreadas
    };
    guardarEnStorage('asesores', asesores);
  }

  // Cargar datos al iniciar sesión
  static cargarDatos(idAsesor) {
    const asesores = obtenerDeStorage('asesores') || {};
    return asesores[idAsesor] || { materias: [], asesoriasCreadas: [] };
  }
}