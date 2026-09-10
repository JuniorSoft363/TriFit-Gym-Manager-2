import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL } from '../../shared/material';
import { ReporteTablaComponent } from './reporte-tabla.component';
import { Columna } from '../../shared/campos';
import { FiltroReporte } from './filtro-reporte';
import { ApiService } from '../../core/services/api.service';
import { MetricasDashboard } from '../../core/models';
import { AreaChartComponent, PuntoSerie } from '../../shared/charts/area-chart.component';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { DonutChartComponent, SegmentoDona } from '../../shared/charts/donut-chart.component';

const COLORES_ESTADO_MEMBRESIA: Record<string, string> = {
  ACTIVA: '#10b981',
  VENCIDA: '#f43f5e',
  SUSPENDIDA: '#f59e0b',
  CANCELADA: '#64748b'
};

const COLORES_ESTADO_PAGO: Record<string, string> = {
  PAGADO: '#10b981',
  PENDIENTE: '#f59e0b',
  ANULADO: '#f43f5e'
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL,
    ReporteTablaComponent,
    AreaChartComponent,
    BarChartComponent,
    DonutChartComponent
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  private api = inject(ApiService);

  metricas = signal<MetricasDashboard | null>(null);
  vencimientos = signal<any | null>(null);
  cargandoResumen = signal(true);

  ngOnInit() {
    this.api.get<MetricasDashboard>('dashboard/metricas').subscribe({
      next: (r) => {
        this.metricas.set(r);
        this.cargandoResumen.set(false);
      },
      error: () => this.cargandoResumen.set(false)
    });
    this.api.get('membresias/resumen-vencimientos').subscribe({
      next: (r) => this.vencimientos.set(r)
    });
  }

  serieIngresos = computed<PuntoSerie[]>(() =>
    (this.metricas()?.ingresosPorMes || []).map((m) => ({ label: m.etiqueta, value: m.total }))
  );
  serieAsistencias = computed<PuntoSerie[]>(() =>
    (this.metricas()?.asistenciasPorDia || []).map((d) => ({ label: d.etiqueta, value: d.total }))
  );
  segmentosPlanes = computed<SegmentoDona[]>(() =>
    (this.metricas()?.distribucionPlanes || []).map((p) => ({ label: p.plan, value: p.total }))
  );
  segmentosVencimientos = computed<SegmentoDona[]>(() => {
    const v = this.vencimientos();
    if (!v) return [];
    return [
      { label: 'Activas', value: v.activas, color: 'var(--tf-success)' },
      { label: 'Vencidas', value: v.vencidas, color: 'var(--tf-danger)' },
      { label: 'Suspendidas', value: v.suspendidas, color: 'var(--tf-warning)' }
    ].filter((s) => s.value > 0);
  });

  totalIngresos6m = computed(() =>
    (this.metricas()?.ingresosPorMes || []).reduce((s, m) => s + m.total, 0)
  );
  columnasClientes: Columna[] = [
    { clave: 'cedula', titulo: 'Cédula' },
    { clave: 'nombres', titulo: 'Nombres' },
    { clave: 'apellidos', titulo: 'Apellidos' },
    { clave: 'telefono', titulo: 'Teléfono' },
    { clave: 'membresias.0.plan.nombre', titulo: 'Plan actual' },
    { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
  ];
  filtrosClientes: FiltroReporte[] = [
    { clave: 'busqueda', etiqueta: 'Buscar por cédula o nombre', tipo: 'texto' },
    {
      clave: 'activo',
      etiqueta: 'Estado',
      tipo: 'select',
      opciones: [
        { valor: 'true', etiqueta: 'Activos' },
        { valor: 'false', etiqueta: 'Inactivos' }
      ]
    }
  ];

  columnasMembresias: Columna[] = [
    { clave: 'cliente.cedula', titulo: 'Cédula' },
    { clave: 'cliente.nombres', titulo: 'Nombres' },
    { clave: 'cliente.apellidos', titulo: 'Apellidos' },
    { clave: 'plan.nombre', titulo: 'Plan' },
    { clave: 'fechaInicio', titulo: 'Inicio', tipo: 'fecha' },
    { clave: 'fechaFin', titulo: 'Fin', tipo: 'fecha' },
    { clave: 'estado', titulo: 'Estado', tipo: 'estado', colores: COLORES_ESTADO_MEMBRESIA }
  ];
  filtrosMembresias: FiltroReporte[] = [
    { clave: 'busqueda', etiqueta: 'Buscar por cédula o nombre', tipo: 'texto' },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      tipo: 'select',
      opciones: [
        { valor: 'ACTIVA', etiqueta: 'Activa' },
        { valor: 'VENCIDA', etiqueta: 'Vencida' },
        { valor: 'SUSPENDIDA', etiqueta: 'Suspendida' },
        { valor: 'CANCELADA', etiqueta: 'Cancelada' }
      ]
    }
  ];

  columnasIngresos: Columna[] = [
    { clave: 'membresia.cliente.nombres', titulo: 'Nombres' },
    { clave: 'membresia.cliente.apellidos', titulo: 'Apellidos' },
    { clave: 'membresia.plan.nombre', titulo: 'Plan' },
    { clave: 'monto', titulo: 'Monto', tipo: 'moneda' },
    { clave: 'metodo', titulo: 'Método' },
    { clave: 'estado', titulo: 'Estado', tipo: 'estado', colores: COLORES_ESTADO_PAGO },
    { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' }
  ];
  filtrosIngresos: FiltroReporte[] = [
    { clave: 'busqueda', etiqueta: 'Buscar por cliente', tipo: 'texto' },
    {
      clave: 'metodo',
      etiqueta: 'Método',
      tipo: 'select',
      opciones: [
        { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
        { valor: 'TARJETA', etiqueta: 'Tarjeta' },
        { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' }
      ]
    },
    { clave: 'desde', etiqueta: 'Desde', tipo: 'fecha' },
    { clave: 'hasta', etiqueta: 'Hasta', tipo: 'fecha' }
  ];

  columnasAsistencias: Columna[] = [
    { clave: 'cliente.cedula', titulo: 'Cédula' },
    { clave: 'cliente.nombres', titulo: 'Nombres' },
    { clave: 'cliente.apellidos', titulo: 'Apellidos' },
    { clave: 'horaEntrada', titulo: 'Entrada', tipo: 'fecha' },
    { clave: 'horaSalida', titulo: 'Salida', tipo: 'fecha' }
  ];
  filtrosAsistencias: FiltroReporte[] = [
    { clave: 'busqueda', etiqueta: 'Buscar por cédula o nombre', tipo: 'texto' },
    { clave: 'desde', etiqueta: 'Desde', tipo: 'fecha' },
    { clave: 'hasta', etiqueta: 'Hasta', tipo: 'fecha' }
  ];

  columnasInventario: Columna[] = [
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'tipo', titulo: 'Tipo' },
    { clave: 'precio', titulo: 'Precio', tipo: 'moneda' },
    { clave: 'stock', titulo: 'Stock' },
    { clave: 'stockMinimo', titulo: 'Stock mínimo' },
    { clave: 'proveedor.nombre', titulo: 'Proveedor' }
  ];
  filtrosInventario: FiltroReporte[] = [
    { clave: 'busqueda', etiqueta: 'Buscar producto...', tipo: 'texto' },
    {
      clave: 'tipo',
      etiqueta: 'Tipo',
      tipo: 'select',
      opciones: [
        { valor: 'PRODUCTO', etiqueta: 'Producto' },
        { valor: 'EQUIPO', etiqueta: 'Equipo' }
      ]
    },
    {
      clave: 'bajoStock',
      etiqueta: 'Bajo stock',
      tipo: 'select',
      opciones: [{ valor: 'true', etiqueta: 'Solo bajo stock' }]
    }
  ];
}
