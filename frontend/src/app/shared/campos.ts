// Describe una columna de una tabla genérica
export interface Columna {
  clave: string; // nombre de la propiedad (soporta "rel.prop" con punto)
  titulo: string;
  tipo?: 'texto' | 'fecha' | 'moneda' | 'estado' | 'booleano';
  colores?: Record<string, string>; // para tipo 'estado': valor -> color hex
}

export type TipoCampo = 'texto' | 'numero' | 'email' | 'password' | 'select' | 'fecha' | 'textarea' | 'checkbox';

// Describe un campo de formulario reactivo generado dinámicamente
export interface Campo {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  opciones?: { valor: any; etiqueta: string }[];
  soloCrear?: boolean; // el campo solo aparece al crear (ej. password)
  ancho?: 'completo' | 'medio';
  placeholder?: string;
}

// Extrae un valor anidado de un objeto usando una clave con puntos ("rel.prop")
export function valorAnidado(obj: any, clave: string): any {
  return clave.split('.').reduce((acc, parte) => (acc ? acc[parte] : undefined), obj);
}
