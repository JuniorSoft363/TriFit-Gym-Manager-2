import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-asistencias',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL],
  templateUrl: './asistencias.component.html'
})
export class AsistenciasComponent implements OnInit {
  cedula = '';
  buscando = false;
  registrando = false;
  cliente: any = null;
  membresia: any = null;
  entradaAbierta: any = null;

  registros: any[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  cargando = false;
  columnas = ['cliente', 'cedula', 'entrada', 'salida'];

  constructor(
    private api: ApiService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargar();
  }

  buscar() {
    if (!this.cedula) return;
    this.buscando = true;
    this.cliente = null;
    this.membresia = null;
    this.entradaAbierta = null;
    this.api.get(`asistencias/consultar/${this.cedula}`).subscribe({
      next: (res: any) => {
        this.cliente = res.cliente;
        this.membresia = res.membresia;
        this.entradaAbierta = res.entradaAbierta;
        this.buscando = false;
      },
      error: () => (this.buscando = false)
    });
  }

  registrarEntrada() {
    this.registrando = true;
    this.api.post('asistencias/entrada', { cedula: this.cedula }).subscribe({
      next: () => {
        this.registrando = false;
        this.snack.open('Entrada registrada', 'Cerrar', { duration: 3000 });
        this.buscar();
        this.cargar();
      },
      error: () => (this.registrando = false)
    });
  }

  registrarSalida() {
    this.registrando = true;
    this.api.post('asistencias/salida', { cedula: this.cedula }).subscribe({
      next: () => {
        this.registrando = false;
        this.snack.open('Salida registrada', 'Cerrar', { duration: 3000 });
        this.buscar();
        this.cargar();
      },
      error: () => (this.registrando = false)
    });
  }

  cargar() {
    this.cargando = true;
    this.api
      .listar('asistencias', { fecha: new Date().toISOString().slice(0, 10), page: this.pageIndex + 1, limit: this.pageSize })
      .subscribe({
        next: (res: any) => {
          this.registros = res.datos;
          this.total = res.total;
          this.cargando = false;
        },
        error: () => (this.cargando = false)
      });
  }

  onPagina(evento: any) {
    this.pageIndex = evento.pageIndex;
    this.pageSize = evento.pageSize;
    this.cargar();
  }
}
