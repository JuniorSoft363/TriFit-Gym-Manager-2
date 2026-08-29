import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';
import { ProductoDetalleComponent } from './producto-detalle.component';
import { ProductoFormDialogComponent } from './producto-form-dialog.component';

@Component({
  selector: 'app-catalogo-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, MATERIAL],
  templateUrl: './catalogo-productos.component.html',
  styleUrl: './catalogo-productos.component.scss'
})
export class CatalogoProductosComponent implements OnInit {
  productos = signal<any[]>([]);
  cargando = signal(false);
  busqueda = '';
  filtroTipo = '';
  filtroStock: 'todos' | 'agotados' | 'bajo' = 'todos';
  orden: 'nombre' | 'precio' | 'stock' = 'nombre';
  apiBase = 'http://localhost:3000';

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.api.listar('inventario/productos', { limit: 100 }).subscribe({
      next: (res: any) => {
        this.productos.set(res.datos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  urlImagen(p: any): string | null {
    if (!p.imagenUrl) return null;
    return p.imagenUrl.startsWith('http') ? p.imagenUrl : `${this.apiBase}${p.imagenUrl}`;
  }

  badgeStock(p: any): { clase: string; texto: string } {
    if (p.stock <= 0) return { clase: 'tf-tag tf-tag-rojo', texto: 'Agotado' };
    if (p.stock <= p.stockMinimo) return { clase: 'tf-tag tf-tag-naranja', texto: `Stock bajo (${p.stock})` };
    return { clase: 'tf-tag tf-tag-verde', texto: `En stock (${p.stock})` };
  }

  verDetalle(p: any) {
    this.dialog.open(ProductoDetalleComponent, {
      data: { producto: p, apiBase: this.apiBase },
      width: '720px',
      maxHeight: '90vh'
    });
  }

  abrirFormulario(producto?: any) {
    this.dialog
      .open(ProductoFormDialogComponent, {
        data: { producto },
        width: '560px',
        maxHeight: '90vh'
      })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        this.snack.open(r.mensaje || 'Producto guardado', 'Cerrar', { duration: 2500 });
        this.cargar();
      });
  }

  get productosFiltrados(): any[] {
    let lista = [...this.productos()];
    const q = this.busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter((p) => (p.nombre || '').toLowerCase().includes(q));
    }
    if (this.filtroTipo) {
      lista = lista.filter((p) => p.tipo === this.filtroTipo);
    }
    if (this.filtroStock === 'agotados') {
      lista = lista.filter((p) => p.stock <= 0);
    } else if (this.filtroStock === 'bajo') {
      lista = lista.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo);
    }
    if (this.orden === 'nombre') {
      lista.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    } else if (this.orden === 'precio') {
      lista.sort((a, b) => (Number(a.precio) || 0) - (Number(b.precio) || 0));
    } else if (this.orden === 'stock') {
      lista.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    }
    return lista;
  }
}
