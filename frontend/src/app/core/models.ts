export type RolNombre = 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ENTRENADOR';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fotoUrl?: string;
  rol: RolNombre;
}

export interface PerfilCompleto extends UsuarioSesion {
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
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
