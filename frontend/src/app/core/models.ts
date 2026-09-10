export type RolNombre = 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ENTRENADOR';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fotoUrl?: string;
  rol: RolNombre;
  debeCambiarPassword?: boolean;
}

export interface PerfilCompleto extends UsuarioSesion {
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface RespuestaLogin {
  token: string;
  refreshToken: string;
  usuario: UsuarioSesion;
}

export interface RespuestaPagina<T> {
  datos: T[];
  total: number;
  page: number;
  limit: number;
}

// --- Búsqueda global ---
export interface ItemBusqueda {
  id: number;
  titulo: string;
  subtitulo: string;
}

export interface GrupoBusqueda {
  tipo: string;
  etiqueta: string;
  ruta: string;
  datos: ItemBusqueda[];
}

export interface RespuestaBusqueda {
  termino: string;
  total: number;
  grupos: GrupoBusqueda[];
}

// --- Métricas ampliadas del dashboard ---
export interface MetricasDashboard {
  ingresosPorMes: { clave: string; etiqueta: string; total: number }[];
  asistenciasPorDia: { clave: string; etiqueta: string; total: number }[];
  topEntrenadores: { id: number; nombre: string; clientesActivos: number }[];
  stockBajo: { id: number; nombre: string; stock: number; stockMinimo: number }[];
  distribucionPlanes: { plan: string; total: number }[];
  retencion: number;
  clientesActivos: number;
  clientesConMembresia: number;
  generadoEn: string;
}
