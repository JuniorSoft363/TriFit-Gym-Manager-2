import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { CrudPageComponent } from '../../shared/crud-page/crud-page.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Campo, Columna } from '../../shared/campos';
import { ApiService } from '../../core/services/api.service';
import { RutinaDialogComponent } from './rutina-dialog.component';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL, CrudPageComponent],
  templateUrl: './rutinas.component.html'
})
export class RutinasComponent implements OnInit {
  // --- Pestaña Ejercicios ---
  columnasEjercicios: Columna[] = [
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'grupoMuscular', titulo: 'Grupo muscular' },
    { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
  ];

  camposEjercicios: Campo[] = [
    { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { clave: 'grupoMuscular', etiqueta: 'Grupo muscular', tipo: 'texto' },
    { clave: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea' }
  ];

  // --- Pestaña Rutinas ---
  rutinas: any[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  busqueda = '';
  cargando = false;
  columnas = ['nombre', 'objetivo', 'entrenador', 'cliente', 'ejercicios', 'acciones'];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  onTabChange(index: number) {
    if (index === 0 && !this.rutinas.length) this.cargarRutinas();
  }

  ngOnInit() {
    this.cargarRutinas();
  }

  cargarRutinas() {
    this.cargando = true;
    this.api
      .listar('rutinas', { busqueda: this.busqueda, page: this.pageIndex + 1, limit: this.pageSize })
      .subscribe({
        next: (res: any) => {
          this.rutinas = res.datos;
          this.total = res.total;
          this.cargando = false;
        },
        error: () => (this.cargando = false)
      });
  }

  onBusquedaCambio() {
    this.pageIndex = 0;
    this.cargarRutinas();
  }

  onPagina(evento: any) {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargarRutinas();
  }

  abrirNueva() {
    this.dialog
      .open(RutinaDialogComponent, { width: '660px', data: { esEdicion: false } })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        this.snack.open('Rutina creada correctamente', 'Cerrar', { duration: 3000 });
        this.cargarRutinas();
      });
  }

  abrirEditar(rutina: any) {
    this.dialog
      .open(RutinaDialogComponent, { width: '660px', data: { esEdicion: true, rutina } })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        this.snack.open('Rutina actualizada', 'Cerrar', { duration: 3000 });
        this.cargarRutinas();
      });
  }

  confirmarEliminar(rutina: any) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { titulo: 'Confirmar', mensaje: '¿Desea desactivar esta rutina?', textoConfirmar: 'Desactivar' }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.eliminar('rutinas', rutina.id).subscribe(() => {
          this.snack.open('Rutina desactivada', 'Cerrar', { duration: 3000 });
          this.cargarRutinas();
        });
      });
  }
}
