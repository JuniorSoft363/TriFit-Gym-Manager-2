import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { CountUpDirective } from '../../shared/count-up.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Resumen {
  clientesActivos: number;
  membresiasActivas: number;
  membresiasPorVencer: number;
  asistenciasHoy: number;
  ingresosDia: number | string;
  ingresosMes: number | string;
  ultimosPagos: any[];
}

interface Kpi {
  etiqueta: string;
  valor: number;
  icono: string;
  color: string;
  moneda?: boolean;
  contexto: string;
}

interface Acceso {
  ruta: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MATERIAL, CountUpDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  resumen = signal<Resumen | null>(null);
  cargando = signal(true);
  columnasPagos = ['cliente', 'plan', 'monto', 'metodo', 'estado', 'fecha'];
  porVencer = signal<any[]>([]);
  columnasPorVencer = ['cliente', 'plan', 'vence', 'dias', 'acciones'];

  hoy = new Date();

  accesosRapidos: Acceso[] = [
    { ruta: '/app/clientes', etiqueta: 'Clientes', icono: 'groups' },
    { ruta: '/app/membresias', etiqueta: 'Membresías', icono: 'card_membership' },
    { ruta: '/app/pagos', etiqueta: 'Pagos', icono: 'payments' },
    { ruta: '/app/asistencias', etiqueta: 'Asistencias', icono: 'how_to_reg' }
  ];

  kpis = computed<Kpi[]>(() => {
    const r = this.resumen();
    if (!r) return [];
    return [
      {
        etiqueta: 'Clientes activos',
        valor: r.clientesActivos,
        icono: 'groups',
        color: 'indigo',
        contexto: 'Miembros con cuenta habilitada'
      },
      {
        etiqueta: 'Membresías activas',
        valor: r.membresiasActivas,
        icono: 'card_membership',
        color: 'emerald',
        contexto: 'Planes vigentes en este momento'
      },
      {
        etiqueta: 'Por vencer (7 días)',
        valor: r.membresiasPorVencer,
        icono: 'event_busy',
        color: 'amber',
        contexto: 'Requieren renovación pronto'
      },
      {
        etiqueta: 'Asistencias hoy',
        valor: r.asistenciasHoy,
        icono: 'how_to_reg',
        color: 'sky',
        contexto: 'Ingresos registrados por cédula'
      },
      {
        etiqueta: 'Ingresos del día',
        valor: Number(r.ingresosDia) || 0,
        icono: 'today',
        color: 'indigo',
        moneda: true,
        contexto: 'Pagos confirmados hoy'
      },
      {
        etiqueta: 'Ingresos del mes',
        valor: Number(r.ingresosMes) || 0,
        icono: 'trending_up',
        color: 'emerald',
        moneda: true,
        contexto: 'Acumulado del mes en curso'
      }
    ];
  });

  /** Proporción de membresías por vencer sobre el total de activas (0–100). */
  porcentajePorVencer = computed(() => {
    const r = this.resumen();
    if (!r || !r.membresiasActivas) return 0;
    return Math.min(100, Math.round((r.membresiasPorVencer / r.membresiasActivas) * 100));
  });

  /** Ancho relativo de la barra "día" respecto a la barra "mes". */
  ratioDiaMes = computed(() => {
    const r = this.resumen();
    const dia = Number(r?.ingresosDia) || 0;
    const mes = Number(r?.ingresosMes) || 0;
    if (!mes) return 0;
    return Math.min(100, Math.round((dia / mes) * 100));
  });

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargarResumen();
    this.cargarPorVencer();
  }

  cargarResumen() {
    this.api.get<Resumen>('dashboard/resumen').subscribe({
      next: (res) => {
        this.resumen.set(res);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  cargarPorVencer() {
    this.api.get<any[]>('membresias/por-vencer', { dias: 7 }).subscribe({
      next: (res) => this.porVencer.set((res || []).slice(0, 8)),
      error: () => this.porVencer.set([])
    });
  }

  diasRestantes(m: any): number {
    const ms = new Date(m.fechaFin).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  textoDias(m: any): string {
    const d = this.diasRestantes(m);
    return d === 0 ? 'hoy' : d === 1 ? '1 día' : `${d} días`;
  }

  renovarDesdePanel(m: any) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          titulo: 'Renovar membresía',
          mensaje: `¿Renovar la membresía de ${m.cliente?.nombres} ${m.cliente?.apellidos}?`,
          textoConfirmar: 'Renovar'
        }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.patch(`membresias/${m.id}/renovar`).subscribe(() => {
          this.snack.open('Membresía renovada', 'Cerrar', { duration: 3000 });
          this.cargarPorVencer();
          this.cargarResumen();
        });
      });
  }

  saludo(): string {
    const h = this.hoy.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  primerNombre(): string {
    return (this.auth.usuario()?.nombre || '').trim().split(/\s+/)[0] || '';
  }

  colorEstado(estado: string): string {
    const mapa: Record<string, string> = {
      PAGADO: 'var(--tf-success)',
      PENDIENTE: 'var(--tf-warning)',
      ANULADO: 'var(--tf-danger)'
    };
    return mapa[estado] || 'var(--tf-text-tertiary)';
  }
}
