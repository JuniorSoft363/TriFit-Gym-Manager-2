import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';

/**
 * Revela un elemento (fade + slide up) cuando entra en el viewport.
 * Uso: <div tfReveal [tfRevealDelay]="120"> ... </div>
 * Requiere la clase base .tf-reveal (definida en styles.scss).
 * Respeta prefers-reduced-motion.
 */
@Directive({
  selector: '[tfReveal]',
  standalone: true
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  @Input() tfRevealDelay = 0;

  private obs?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const nodo = this.el.nativeElement;
    nodo.classList.add('tf-reveal');
    if (this.tfRevealDelay) {
      nodo.style.transitionDelay = `${this.tfRevealDelay}ms`;
    }

    const reduce =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || typeof IntersectionObserver === 'undefined') {
      nodo.classList.add('tf-revealed');
      return;
    }

    this.obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            nodo.classList.add('tf-revealed');
            this.obs?.unobserve(nodo);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.obs.observe(nodo);
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
  }
}
