import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PuntoSerie {
  label: string;
  value: number;
}

/**
 * Gráfica de área/línea en SVG puro (sin librerías). Traza animado, degradado,
 * cuadrícula y tooltip al pasar el mouse. Se adapta al ancho del contenedor.
 */
@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tf-chart" (mouseleave)="activo.set(null)">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" class="tf-chart-svg">
        <defs>
          <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.35" />
            <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
          </linearGradient>
        </defs>

        <line
          *ngFor="let g of grid()"
          [attr.x1]="0"
          [attr.x2]="W"
          [attr.y1]="g"
          [attr.y2]="g"
          class="tf-chart-grid"
        />

        <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gradId + ')'" class="tf-chart-area" />
        <path
          [attr.d]="linePath()"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="tf-chart-line"
          [class.tf-anim]="animar()"
        />

        <g *ngFor="let p of coords(); let i = index">
          <circle
            [attr.cx]="p.x"
            [attr.cy]="p.y"
            [attr.r]="activo() === i ? 4 : 2.5"
            [attr.fill]="color()"
            class="tf-chart-dot"
          />
          <rect
            [attr.x]="p.x - stepX() / 2"
            [attr.y]="0"
            [attr.width]="stepX()"
            [attr.height]="H"
            fill="transparent"
            (mouseenter)="activo.set(i)"
          />
        </g>
      </svg>

      <div class="tf-chart-tip" *ngIf="activo() !== null" [style.left.%]="tipLeft()">
        <strong>{{ prefix() }}{{ puntos()[activo()!].value | number: '1.0-2' }}{{ suffix() }}</strong>
        <span>{{ puntos()[activo()!].label }}</span>
      </div>

      <div class="tf-chart-xlabels">
        <span *ngFor="let p of puntos()">{{ p.label }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .tf-chart {
        position: relative;
        width: 100%;
      }
      .tf-chart-svg {
        width: 100%;
        height: 150px;
        display: block;
        overflow: visible;
      }
      .tf-chart-grid {
        stroke: var(--tf-border);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .tf-chart-line {
        vector-effect: non-scaling-stroke;
      }
      .tf-chart-line.tf-anim {
        stroke-dasharray: 1400;
        stroke-dashoffset: 1400;
        animation: tf-draw 1.1s ease forwards;
      }
      .tf-chart-area {
        opacity: 0;
        animation: tf-fade 0.8s ease 0.5s forwards;
      }
      .tf-chart-dot {
        transition: r 0.15s ease;
      }
      @keyframes tf-draw {
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes tf-fade {
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .tf-chart-line.tf-anim {
          animation: none;
          stroke-dashoffset: 0;
        }
        .tf-chart-area {
          animation: none;
          opacity: 1;
        }
      }
      .tf-chart-tip {
        position: absolute;
        top: -6px;
        transform: translateX(-50%);
        background: var(--tf-surface-3, #1e273b);
        border: 1px solid var(--tf-border-strong);
        border-radius: 8px;
        padding: 4px 10px;
        font-size: 0.78rem;
        white-space: nowrap;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.5);
      }
      .tf-chart-tip span {
        opacity: 0.6;
        font-size: 0.7rem;
      }
      .tf-chart-xlabels {
        display: flex;
        justify-content: space-between;
        margin-top: 6px;
        font-size: 0.72rem;
        opacity: 0.6;
      }
      .tf-chart-xlabels span {
        flex: 1;
        text-align: center;
      }
    `
  ]
})
export class AreaChartComponent {
  puntos = input<PuntoSerie[]>([]);
  color = input('var(--tf-primary)');
  prefix = input('');
  suffix = input('');
  animar = input(true);

  readonly W = 100;
  readonly H = 40;
  gradId = 'tfgrad_' + Math.random().toString(36).slice(2, 8);
  activo = signal<number | null>(null);

  private max = computed(() => Math.max(1, ...this.puntos().map((p) => p.value)));

  stepX = computed(() => (this.puntos().length > 1 ? this.W / (this.puntos().length - 1) : this.W));

  coords = computed(() =>
    this.puntos().map((p, i) => ({
      x: this.puntos().length > 1 ? (i / (this.puntos().length - 1)) * this.W : this.W / 2,
      y: this.H - (p.value / this.max()) * (this.H - 4) - 2
    }))
  );

  linePath = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    return c.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  });

  areaPath = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    const linea = c.map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    return `M${c[0].x.toFixed(2)},${this.H} ${linea} L${c[c.length - 1].x.toFixed(2)},${this.H} Z`;
  });

  grid = () => [0.25, 0.5, 0.75, 1].map((f) => +(f * this.H).toFixed(2));

  tipLeft = () => {
    const i = this.activo();
    if (i === null || this.puntos().length < 2) return 50;
    return (i / (this.puntos().length - 1)) * 100;
  };
}
