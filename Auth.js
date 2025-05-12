import Usuario from './Usuario.js';
import { guardarEnStorage, obtenerDeStorage } from './storage.js';

class Auth {
  static login(correo, contrasena) {
    const usuarios = obtenerDeStorage('usuarios') || [];
    const usuario = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);

    if (usuario) {
      return new Usuario(usuario.id, usuario.nombre, usuario.correo, usuario.tipo);
    }
    return null;
  }

  static registrar(nombre, correo, contrasena, tipo) {
    const nuevoUsuario = {
      id: Date.now().toString(),
      nombre,
      correo,
      contrasena,
      tipo
    };

    const usuarios = obtenerDeStorage('usuarios') || [];
    usuarios.push(nuevoUsuario);
    guardarEnStorage('usuarios', usuarios);

    return new Usuario(nuevoUsuario.id, nombre, correo, tipo);
  }
}