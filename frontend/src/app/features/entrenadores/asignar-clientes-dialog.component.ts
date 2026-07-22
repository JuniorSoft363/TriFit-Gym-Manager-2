import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-asignar-clientes-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL],
  templateUrl: './asignar-clientes-dialog.component.html'
})
export class AsignarClientesDialogComponent implements OnInit {
  cedula = '';
  buscando = false;
  cargando = true;
  asignaciones: any[] = [];

  constructor(
    private api: ApiService,
    private snack: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { entrenadorId: number; nombreEntrenador: string }
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.api.get<any[]>(`entrenadores/${this.data.entrenadorId}/clientes`).subscribe({
      next: (res) => {
        this.asignaciones = res;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  agregar() {
    if (!this.cedula) return;
    this.buscando = true;
    this.api.get(`clientes/cedula/${this.cedula}`).subscribe({
      next: (cliente: any) => {
        this.api.post(`entrenadores/${this.data.entrenadorId}/clientes`, { clienteId: cliente.id }).subscribe({
          next: () => {
            this.buscando = false;
            this.cedula = '';
            this.snack.open('Cliente asignado', 'Cerrar', { duration: 3000 });
            this.cargar();
          },
          error: () => (this.buscando = false)
        });
      },
      error: () => {
        this.buscando = false;
        this.snack.open('Cliente no encontrado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  quitar(asignacion: any) {
    this.api
      .eliminar(`entrenadores/${this.data.entrenadorId}/clientes`, asignacion.clienteId)
      .subscribe(() => {
        this.snack.open('Cliente removido', 'Cerrar', { duration: 3000 });
        this.cargar();
      });
  }
}
