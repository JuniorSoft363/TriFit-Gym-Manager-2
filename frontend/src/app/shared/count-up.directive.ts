import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';

/**
 * Anima un número desde 0 hasta `tfCountUp` cuando cambia el valor.
 * Uso: <span [tfCountUp]="valor" [tfCountUpPrefix]="'$'" [tfCountUpDecimals]="2"></span>
 * Respeta prefers-reduced-motion (pinta el valor final al instante).
 */
@Directive({
  selector: '[tfCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('tfCountUp') valor = 0;
  @Input() tfCountUpDecimals = 0;
  @Input() tfCountUpPrefix = '';
  @Input() tfCountUpSuffix = '';
  @Input() tfCountUpDuration = 850;

  private frame = 0;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(_c: SimpleChanges): void {
    cancelAnimationFrame(this.frame);
    const destino = Number(this.valor) || 0;

    const reduce =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || this.tfCountUpDuration <= 0) {
      this.pintar(destino);
      return;
    }

    const inicio = performance.now();
    const desde = 0;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / this.tfCountUpDuration);
      // easeOutCubic
      const e = 1 - Math.pow(1 - t, 3);
      this.pintar(desde + (destino - desde) * e);
      if (t < 1) this.frame = requestAnimationFrame(paso);
    };
    this.frame = requestAnimationFrame(paso);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
  }

  private pintar(n: number): void {
    const fijo = n.toLocaleString('es-EC', {
      minimumFractionDigits: this.tfCountUpDecimals,
      maximumFractionDigits: this.tfCountUpDecimals
    });
    this.el.nativeElement.textContent = `${this.tfCountUpPrefix}${fijo}${this.tfCountUpSuffix}`;
  }
}
