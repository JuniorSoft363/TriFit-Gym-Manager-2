import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { debounceTime, Subject } from 'rxjs';
import { MATERIAL } from '../material';
import { ApiService } from '../../core/services/api.service';
import { Campo, Columna, valorAnidado } from '../campos';
import { CrudDialogComponent } from '../crud-dialog/crud-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

export interface AccionExtra {
  icono: string;
  tooltip: string;
  accion: (fila: any) => void;
  mostrar?: (fila: any) => boolean;
}

@Component({
  selector: 'app-crud-page',
  standalone: true,
  imports: [CommonModule, MATERIAL],
  templateUrl: './crud-page.component.html'
})
export class CrudPageComponent implements OnInit, OnChanges {
  @Input() recurso!: string;
  @Input() titulo = '';
  @Input() columnas: Columna[] = [];
  @Input() campos: Campo[] = [];
  @Input() soloLectura = false;
  @Input() permiteCrear = true;
  @Input() permiteEditar = true;
  @Input() permiteEliminar = true;
  @Input() textoEliminar = '¿Desea desactivar este registro?';
  @Input() busquedaPlaceholder = 'Buscar...';
  @Input() accionesExtra: AccionExtra[] = [];
  @Input() filtrosFijos: Record<string, any> = {};

  datos: any[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  busqueda = '';
  cargando = false;

  private busquedaCambio = new Subject<string>();

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {
    this.busquedaCambio.pipe(debounceTime(350)).subscribe(() => {
      this.pageIndex = 0;
      this.cargar();
    });
  }

  ngOnInit() {
    this.cargar();
  }

  ngOnChanges() {
    // Si cambian los filtros fijos desde el padre (ej. pestañas), recargar desde la primera página
    if (this.datos.length || this.total) {
      this.pageIndex = 0;
      this.cargar();
    }
  }

  get columnasVisibles(): string[] {
    const claves = this.columnas.map((c) => c.clave);
    if (this.mostrarColumnaAcciones) claves.push('acciones');
    return claves;
  }

  get mostrarColumnaAcciones(): boolean {
    return this.accionesExtra.length > 0 || (!this.soloLectura && (this.permiteEditar || this.permiteEliminar));
  }

  valor(fila: any, columna: Columna) {
    return valorAnidado(fila, columna.clave);
  }

  onBusqueda(texto: string) {
    this.busqueda = texto;
    this.busquedaCambio.next(texto);
  }

  onPagina(evento: PageEvent) {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    const query = {
      busqueda: this.busqueda,
      page: this.pageIndex + 1,
      limit: this.pageSize,
      ...this.filtrosFijos
    };
    this.api.listar(this.recurso, query).subscribe({
      next: (res) => {
        this.datos = res.datos;
        this.total = res.total;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  recargar() {
    this.cargar();
  }

  abrirCrear() {
    this.dialog
      .open(CrudDialogComponent, {
        width: '600px',
        data: { titulo: `Nuevo registro`, campos: this.campos, esEdicion: false }
      })
      .afterClosed()
      .subscribe((valores) => {
        if (!valores) return;
        this.api.crear(this.recurso, valores).subscribe(() => {
          this.snack.open('Registro creado correctamente', 'Cerrar', { duration: 3000 });
          this.cargar();
        });
      });
  }

  abrirEditar(fila: any) {
    this.dialog
      .open(CrudDialogComponent, {
        width: '600px',
        data: { titulo: `Editar registro`, campos: this.campos, valores: fila, esEdicion: true }
      })
      .afterClosed()
      .subscribe((valores) => {
        if (!valores) return;
        this.api.editar(this.recurso, fila.id, valores).subscribe(() => {
          this.snack.open('Registro actualizado', 'Cerrar', { duration: 3000 });
          this.cargar();
        });
      });
  }

  confirmarEliminar(fila: any) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { titulo: 'Confirmar', mensaje: this.textoEliminar, textoConfirmar: 'Desactivar' }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.eliminar(this.recurso, fila.id).subscribe(() => {
          this.snack.open('Registro desactivado', 'Cerrar', { duration: 3000 });
          this.cargar();
        });
      });
  }
}
