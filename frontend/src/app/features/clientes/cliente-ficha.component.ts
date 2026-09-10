import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';
import { CountUpDirective } from '../../shared/count-up.directive';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { PuntoSerie } from '../../shared/charts/area-chart.component';

const COLORES_ESTADO: Record<string, string> = {
  ACTIVA: 'var(--tf-success)',
  VENCIDA: 'var(--tf-danger)',
  SUSPENDIDA: 'var(--tf-warning)',
  CANCELADA: 'var(--tf-text-tertiary)'
};

@Component({
  selector: 'app-cliente-ficha',
  standalone: true,
  imports: [CommonModule, RouterLink, MATERIAL, CountUpDirective, BarChartComponent],
  templateUrl: './cliente-ficha.component.html',
  styleUrl: './cliente-ficha.component.scss'
})
export class ClienteFichaComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  cargando = signal(true);
  error = signal(false);
  h = signal<any | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get(`clientes/${id}/historial`).subscribe({
      next: (res) => {
        this.h.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }

  iniciales = computed(() => {
    const c = this.h();
    if (!c) return '?';
    return `${(c.nombres || '?')[0]}${(c.apellidos || '')[0] || ''}`.toUpperCase();
  });

  membresiaActual = computed(() => {
    const ms = this.h()?.membresias || [];
    return ms.find((m: any) => m.estado === 'ACTIVA') || ms[0] || null;
  });

  totalPagado = computed(() =>
    (this.h()?.membresias || [])
      .flatMap((m: any) => m.pagos || [])
      .filter((p: any) => p.estado === 'PAGADO')
      .reduce((s: number, p: any) => s + Number(p.monto), 0)
  );

  rutinasActivas = computed(() => (this.h()?.rutinas || []).length);

  antiguedadDias = computed(() => {
    const c = this.h();
    if (!c?.creadoEn) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(c.creadoEn).getTime()) / 86400000));
  });

  entrenadores = computed(() =>
    (this.h()?.entrenadores || []).map((e: any) => e.entrenador).filter(Boolean)
  );

  /** Asistencias de los últimos 14 días agrupadas por día para la gráfica. */
  serieAsistencias = computed<PuntoSerie[]>(() => {
    const asistencias = this.h()?.asistencias || [];
    const dias: PuntoSerie[] = [];
    const hoy = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const clave = d.toISOString().slice(0, 10);
      dias.push({ label: d.toLocaleDateString('es-EC', { day: '2-digit' }), value: 0 });
      (dias[dias.length - 1] as any).clave = clave;
    }
    for (const a of asistencias) {
      const clave = new Date(a.horaEntrada).toISOString().slice(0, 10);
      const cubo = dias.find((x) => (x as any).clave === clave);
      if (cubo) cubo.value += 1;
    }
    return dias;
  });

  totalAsistencias = computed(() => (this.h()?.asistencias || []).length);

  colorEstado(estado: string): string {
    return COLORES_ESTADO[estado] || 'var(--tf-text-tertiary)';
  }

  pagadoDe(m: any): number {
    return (m.pagos || [])
      .filter((p: any) => p.estado === 'PAGADO')
      .reduce((s: number, p: any) => s + Number(p.monto), 0);
  }
}
