import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MATERIAL } from '../../shared/material';
import { CountUpDirective } from '../../shared/count-up.directive';
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
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.api.get<Resumen>('dashboard/resumen').subscribe({
      next: (res) => {
        this.resumen.set(res);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
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
