export type RolNombre = 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ENTRENADOR';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: RolNombre;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioSesion;
}

export interface RespuestaPagina<T> {
  datos: T[];
  total: number;
  page: number;
  limit: number;
}
