import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

// Paginador en español para toda la app (por defecto viene en inglés).
@Injectable()
export class PaginadorEspanol extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Registros por página:';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return `0 de ${length}`;
    const inicio = page * pageSize + 1;
    const fin = Math.min((page + 1) * pageSize, length);
    return `${inicio} – ${fin} de ${length}`;
  };
}
