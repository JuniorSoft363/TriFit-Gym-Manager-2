import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MATERIAL } from '../../shared/material';
import { Columna, valorAnidado } from '../../shared/campos';
import { ApiService } from '../../core/services/api.service';
import { exportarPdf } from '../../shared/pdf.util';
import { FiltroReporte } from './filtro-reporte';

@Component({
  selector: 'app-reporte-tabla',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL],
  templateUrl: './reporte-tabla.component.html'
})
export class ReporteTablaComponent implements OnInit, AfterViewInit {
  @Input() recurso!: string;
  @Input() tituloPdf = 'Reporte';
  @Input() columnas: Columna[] = [];
  @Input() filtros: FiltroReporte[] = [];

  @ViewChild(MatSort) sort!: MatSort;

  valoresFiltro: Record<string, any> = {};
  fuente = new MatTableDataSource<any>([]);
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  cargando = false;
  exportando = false;

  constructor(private api: ApiService) {}

  get columnasVisibles(): string[] {
    return this.columnas.map((c) => c.clave);
  }

  ngOnInit() {
    this.cargar();
  }

  ngAfterViewInit() {
    this.fuente.sort = this.sort;
  }

  valor(fila: any, columna: Columna) {
    return valorAnidado(fila, columna.clave);
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

  private query(extra: Record<string, any> = {}) {
    return { ...this.valoresFiltro, ...extra };
  }

  cargar() {
    this.cargando = true;
    this.api.listar(this.recurso, this.query({ page: this.pageIndex + 1, limit: this.pageSize })).subscribe({
      next: (res: any) => {
        this.fuente.data = res.datos;
        this.total = res.total;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  exportar() {
    this.exportando = true;
    this.api.listar(this.recurso, this.query({ page: 1, limit: 1000 })).subscribe({
      next: (res: any) => {
        const encabezados = this.columnas.map((c) => c.titulo);
        const filas = res.datos.map((fila: any) =>
          this.columnas.map((c) => {
            const v = this.valor(fila, c);
            if (v === null || v === undefined) return '';
            if (c.tipo === 'fecha') return new Date(v).toLocaleString('es-EC');
            if (c.tipo === 'moneda') return `$${Number(v).toFixed(2)}`;
            if (c.tipo === 'booleano') return v ? 'Sí' : 'No';
            return String(v);
          })
        );
        exportarPdf(this.tituloPdf, encabezados, filas);
        this.exportando = false;
      },
      error: () => (this.exportando = false)
    });
  }
}
