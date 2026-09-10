import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SegmentoDona {
  label: string;
  value: number;
  color?: string;
}

const PALETA = [
  'var(--tf-primary)',
  'var(--tf-success)',
  'var(--tf-warning)',
  'var(--tf-danger)',
  '#8b5cf6',
  '#0ea5e9'
];

/**
 * Dona en SVG puro con animación de barrido, leyenda y total al centro.
 */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tf-donut">
      <svg viewBox="0 0 42 42" class="tf-donut-svg">
        <circle class="tf-donut-track" cx="21" cy="21" r="15.915" fill="none" stroke-width="4" />
        <circle
          *ngFor="let s of segmentos(); let i = index"
          class="tf-donut-seg"
          [class.tf-donut-dim]="activo() !== null && activo() !== i"
          cx="21"
          cy="21"
          r="15.915"
          fill="none"
          stroke-width="4"
          [attr.stroke]="s.color"
          [attr.stroke-dasharray]="s.dash + ' ' + (100 - s.dash)"
          [attr.stroke-dashoffset]="s.offset"
          (mouseenter)="activo.set(i)"
          (mouseleave)="activo.set(null)"
        />
        <text x="21" y="20" class="tf-donut-total">{{ total() }}</text>
        <text x="21" y="25.5" class="tf-donut-cap">{{ subtitulo() }}</text>
      </svg>

      <ul class="tf-donut-legend">
        <li
          *ngFor="let s of segmentos(); let i = index"
          (mouseenter)="activo.set(i)"
          (mouseleave)="activo.set(null)"
          [class.tf-donut-dim]="activo() !== null && activo() !== i"
        >
          <span class="tf-donut-dot" [style.background]="s.color"></span>
          <span class="tf-donut-lbl">{{ s.label }}</span>
          <span class="tf-donut-val">{{ s.value }} · {{ s.pct }}%</span>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .tf-donut {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }
      .tf-donut-svg {
        width: 160px;
        height: 160px;
        flex: none;
        transform: rotate(-90deg);
      }
      .tf-donut-track {
        stroke: var(--tf-border);
      }
      .tf-donut-seg {
        transition: opacity 0.2s ease, stroke-width 0.2s ease;
        animation: tf-donut-in 0.9s ease forwards;
      }
      .tf-donut-seg.tf-donut-dim {
        opacity: 0.25;
      }
      @keyframes tf-donut-in {
        from {
          stroke-dasharray: 0 100;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .tf-donut-seg {
          animation: none;
        }
      }
      .tf-donut-total {
        transform: rotate(90deg);
        transform-origin: 21px 21px;
        text-anchor: middle;
        font-size: 7px;
        font-weight: 700;
        fill: var(--tf-text, #f1f5f9);
      }
      .tf-donut-cap {
        transform: rotate(90deg);
        transform-origin: 21px 21px;
        text-anchor: middle;
        font-size: 2.6px;
        fill: var(--tf-text-tertiary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.1px;
      }
      .tf-donut-legend {
        list-style: none;
        margin: 0;
        padding: 0;
        flex: 1;
        min-width: 160px;
      }
      .tf-donut-legend li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 0;
        font-size: 0.85rem;
        transition: opacity 0.2s ease;
      }
      .tf-donut-legend li.tf-donut-dim {
        opacity: 0.4;
      }
      .tf-donut-dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        flex: none;
      }
      .tf-donut-lbl {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tf-donut-val {
        font-weight: 600;
        opacity: 0.75;
        font-size: 0.8rem;
      }
    `
  ]
})
export class DonutChartComponent {
  datos = input<SegmentoDona[]>([]);
  subtitulo = input('total');

  activo = signal<number | null>(null);

  total = computed(() => this.datos().reduce((s, d) => s + d.value, 0));

  segmentos = computed(() => {
    const tot = this.total() || 1;
    let acumulado = 0;
    return this.datos().map((d, i) => {
      const dash = (d.value / tot) * 100;
      const seg = {
        ...d,
        color: d.color || PALETA[i % PALETA.length],
        dash: +dash.toFixed(3),
        // offset negativo para encadenar segmentos partiendo de las 12 en punto
        offset: +(100 - acumulado + 25).toFixed(3),
        pct: Math.round((d.value / tot) * 100)
      };
      acumulado += dash;
      return seg;
    });
  });
}
