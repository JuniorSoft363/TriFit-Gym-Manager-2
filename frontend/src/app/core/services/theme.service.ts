import { Injectable, signal } from '@angular/core';

export type Tema = 'dark' | 'light';

const CLAVE = 'tf_theme';

/**
 * Gestiona el tema claro/oscuro. La preferencia se persiste en localStorage
 * y se aplica como clase `tf-light` sobre <html> (el index.html ya la aplica
 * antes de pintar para evitar parpadeo).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.leer());

  constructor() {
    this.aplicar(this.tema());
  }

  alternar(): void {
    this.set(this.tema() === 'dark' ? 'light' : 'dark');
  }

  set(tema: Tema): void {
    this.tema.set(tema);
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      /* almacenamiento no disponible: se mantiene en memoria */
    }
    this.aplicar(tema);
  }

  private aplicar(tema: Tema): void {
    const raiz = document.documentElement;
    raiz.classList.toggle('tf-light', tema === 'light');
    raiz.setAttribute('data-tf-theme', tema);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'light' ? '#eef1f7' : '#0b0f1a');
  }

  private leer(): Tema {
    try {
      const v = localStorage.getItem(CLAVE);
      if (v === 'light' || v === 'dark') return v;
    } catch {
      /* ignore */
    }
    return 'dark';
  }
}
