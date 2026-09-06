import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { CrudPageComponent } from '../../shared/crud-page/crud-page.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Campo, Columna } from '../../shared/campos';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AsignarMembresiaDialogComponent } from './asignar-membresia-dialog.component';

const COLORES_ESTADO: Record<string, string> = {
  ACTIVA: '#10b981',
  VENCIDA: '#f43f5e',
  SUSPENDIDA: '#f59e0b',
  CANCELADA: '#64748b'
};

@Component({
  selector: 'app-membresias',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL, CrudPageComponent],
  templateUrl: './membresias.component.html'
})
export class MembresiasComponent {
  // --- Pestaña Planes ---
  columnasPlanes: Columna[] = [
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'duracionDias', titulo: 'Duración (días)' },
    { clave: 'precio', titulo: 'Precio', tipo: 'moneda' },
    { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
  ];

  camposPlanes: Campo[] = [
    { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { clave: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea' },
    { clave: 'duracionDias', etiqueta: 'Duración en días', tipo: 'numero', requerido: true, ancho: 'medio' },
    { clave: 'precio', etiqueta: 'Precio', tipo: 'numero', requerido: true, ancho: 'medio' }
  ];

  // --- Pestaña Membresías ---
  membresias: any[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  busqueda = '';
  estadoFiltro = '';
  cargando = false;
  columnasMembresias = ['cliente', 'cedula', 'plan', 'inicio', 'fin', 'estado', 'acciones'];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public auth: AuthService
  ) {}

  get soloLecturaPlanes(): boolean {
    return !this.auth.tieneRol('ADMINISTRADOR');
  }

  colorEstado(estado: string) {
    return COLORES_ESTADO[estado] || '#607d8b';
  }

  onTabChange(index: number) {
    if (index === 1 && !this.membresias.length) this.cargarMembresias();
  }

  cargarMembresias() {
    this.cargando = true;
    this.api
      .listar('membresias', {
        busqueda: this.busqueda,
        estado: this.estadoFiltro,
        page: this.pageIndex + 1,
        limit: this.pageSize
      })
      .subscribe({
        next: (res) => {
          this.membresias = res.datos;
          this.total = res.total;
          this.cargando = false;
        },
        error: () => (this.cargando = false)
      });
  }

  onPagina(evento: any) {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargarMembresias();
  }

  onFiltroCambio() {
    this.pageIndex = 0;
    this.cargarMembresias();
  }

  abrirAsignar() {
    this.dialog
      .open(AsignarMembresiaDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        this.snack.open('Membresía asignada correctamente', 'Cerrar', { duration: 3000 });
        this.cargarMembresias();
      });
  }

  renovar(fila: any) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          titulo: 'Renovar membresía',
          mensaje: `¿Renovar la membresía de ${fila.cliente?.nombres} ${fila.cliente?.apellidos}?`,
          textoConfirmar: 'Renovar'
        }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.patch(`membresias/${fila.id}/renovar`).subscribe(() => {
          this.snack.open('Membresía renovada', 'Cerrar', { duration: 3000 });
          this.cargarMembresias();
        });
      });
  }

  cambiarEstado(fila: any, estado: string) {
    this.api.patch(`membresias/${fila.id}/estado`, { estado }).subscribe(() => {
      this.snack.open(`Estado actualizado a ${estado}`, 'Cerrar', { duration: 3000 });
      this.cargarMembresias();
    });
  }
}
