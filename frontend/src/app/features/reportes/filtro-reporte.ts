export interface FiltroReporte {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'select' | 'fecha';
  opciones?: { valor: any; etiqueta: string }[];
}
