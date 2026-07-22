import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL],
  templateUrl: './auditoria.component.html'
})
export class AuditoriaComponent implements OnInit {
  registros: any[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 15;
  entidad = '';
  cargando = false;
  columnas = ['fecha', 'usuario', 'accion', 'entidad', 'detalle'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.api
      .listar('configuracion/auditoria', { entidad: this.entidad, page: this.pageIndex + 1, limit: this.pageSize })
      .subscribe({
        next: (res: any) => {
          this.registros = res.datos;
          this.total = res.total;
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
}
