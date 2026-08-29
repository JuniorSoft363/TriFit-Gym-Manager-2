import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { CrudPageComponent } from '../../shared/crud-page/crud-page.component';
import { Columna } from '../../shared/campos';
import { ApiService } from '../../core/services/api.service';
import { MovimientoDialogComponent } from './movimiento-dialog.component';
import { CatalogoProductosComponent } from './catalogo-productos.component';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL, CrudPageComponent, CatalogoProductosComponent],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit {
  // --- Pestaña Proveedores ---
  columnasProveedores: Columna[] = [
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'ruc', titulo: 'RUC' },
    { clave: 'telefono', titulo: 'Teléfono' },
    { clave: 'email', titulo: 'Correo' }
  ];

  camposProveedores = [
    { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
    { clave: 'ruc', etiqueta: 'RUC', tipo: 'texto' },
    { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'texto', ancho: 'medio' },
    { clave: 'email', etiqueta: 'Correo', tipo: 'email', ancho: 'medio' },
    { clave: 'direccion', etiqueta: 'Dirección', tipo: 'texto' }
  ];

  // --- Pestaña Movimientos ---
  movimientos: any[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  cargando = false;
  columnasMovimientos = ['producto', 'tipo', 'cantidad', 'usuario', 'fecha'];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.cargando = true;
    this.api.listar('inventario/movimientos', { page: this.pageIndex + 1, limit: this.pageSize }).subscribe({
      next: (res: any) => {
        this.movimientos = res.datos;
        this.total = res.total;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  onPagina(evento: any) {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargarMovimientos();
  }

  abrirMovimiento() {
    this.dialog
      .open(MovimientoDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        this.snack.open('Movimiento registrado', 'Cerrar', { duration: 3000 });
        this.cargarMovimientos();
      });
  }
}
