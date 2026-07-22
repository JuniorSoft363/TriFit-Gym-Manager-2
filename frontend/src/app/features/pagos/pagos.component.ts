import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../core/services/api.service';
import { RegistrarPagoDialogComponent } from './registrar-pago-dialog.component';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL],
  templateUrl: './pagos.component.html'
})
export class PagosComponent implements OnInit {
  pagos: any[] = [];
  total = 0;
  sumaTotal = 0;
  pageIndex = 0;
  pageSize = 10;
  busqueda = '';
  estadoFiltro = '';
  metodoFiltro = '';
  cargando = false;
  columnas = ['cliente', 'plan', 'monto', 'metodo', 'estado', 'fecha', 'acciones'];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.api
      .listar('pagos', {
        busqueda: this.busqueda,
        estado: this.estadoFiltro,
        metodo: this.metodoFiltro,
        page: this.pageIndex + 1,
        limit: this.pageSize
      })
      .subscribe({
        next: (res: any) => {
          this.pagos = res.datos;
          this.total = res.total;
          this.sumaTotal = res.sumaTotal || 0;
          this.cargando = false;
        },
        error: () => (this.cargando = false)
      });
  }

  onFiltroCambio() {
    this.pageIndex = 0;
    this.cargar();
  }

  onPagina(evento: any) {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargar();
  }

  abrirRegistrar() {
    this.dialog
      .open(RegistrarPagoDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        this.snack.open('Pago registrado correctamente', 'Cerrar', { duration: 3000 });
        this.cargar();
      });
  }

  anular(fila: any) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { titulo: 'Anular pago', mensaje: '¿Desea anular este pago?', textoConfirmar: 'Anular' }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.patch(`pagos/${fila.id}/anular`).subscribe(() => {
          this.snack.open('Pago anulado', 'Cerrar', { duration: 3000 });
          this.cargar();
        });
      });
  }
}
