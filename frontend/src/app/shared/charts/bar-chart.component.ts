import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PuntoSerie } from './area-chart.component';

/**
 * Barras verticales con animación de crecimiento, valor al pasar el mouse y
 * etiquetas en el eje X. HTML/CSS puro (sin SVG ni librerías).
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tf-bars" (mouseleave)="activo.set(null)">
      <div class="tf-bars-plot">
        <div
          class="tf-bars-col"
          *ngFor="let p of puntos(); let i = index"
          (mouseenter)="activo.set(i)"
        >
          <span class="tf-bars-val" [class.tf-show]="activo() === i">
            {{ prefix() }}{{ p.value | number: '1.0-2' }}{{ suffix() }}
          </span>
          <div
            class="tf-bars-bar"
            [class.tf-bars-bar-alt]="alt()"
            [class.tf-dim]="activo() !== null && activo() !== i"
            [style.height.%]="altura(p.value)"
          ></div>
          <span class="tf-bars-lbl">{{ p.label }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .tf-bars-plot {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        height: 150px;
      }
      .tf-bars-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
        position: relative;
        gap: 6px;
      }
      .tf-bars-bar {
        width: 100%;
        max-width: 42px;
        min-height: 3px;
        border-radius: 7px 7px 3px 3px;
        background: linear-gradient(180deg, var(--tf-primary) 0%, var(--tf-primary-strong) 100%);
        transition: opacity 0.2s ease;
        animation: tf-bar-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        transform-origin: bottom;
      }
      .tf-bars-bar-alt {
        background: linear-gradient(180deg, var(--tf-success) 0%, #059669 100%);
      }
      .tf-bars-bar.tf-dim {
        opacity: 0.35;
      }
      @keyframes tf-bar-grow {
        from {
          transform: scaleY(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .tf-bars-bar {
          animation: none;
        }
      }
      .tf-bars-val {
        font-size: 0.72rem;
        font-weight: 700;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.15s ease, transform 0.15s ease;
        white-space: nowrap;
      }
      .tf-bars-val.tf-show {
        opacity: 1;
        transform: translateY(0);
      }
      .tf-bars-lbl {
        font-size: 0.72rem;
        opacity: 0.6;
        text-transform: capitalize;
      }
    `
  ]
})
export class BarChartComponent {
  puntos = input<PuntoSerie[]>([]);
  prefix = input('');
  suffix = input('');
  alt = input(false);

  activo = signal<number | null>(null);
  private max = computed(() => Math.max(1, ...this.puntos().map((p) => p.value)));

  altura(v: number): number {
    return Math.max(2, Math.round((v / this.max()) * 100));
  }
}
