import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MATERIAL],
  templateUrl: './producto-detalle.component.html',
  styleUrl: './producto-detalle.component.scss'
})
export class ProductoDetalleComponent implements OnInit {
  movimientos = signal<any[]>([]);
  cargandoMov = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { producto: any; apiBase: string },
    private api: ApiService,
    public ref: MatDialogRef<ProductoDetalleComponent>
  ) {}

  ngOnInit() {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.cargandoMov.set(true);
    this.api.get(`inventario/productos/${this.data.producto.id}/movimientos`).subscribe({
      next: (res: any) => {
        this.movimientos.set(res);
        this.cargandoMov.set(false);
      },
      error: () => this.cargandoMov.set(false)
    });
  }

  urlImagen(): string | null {
    const p = this.data.producto;
    if (!p.imagenUrl) return null;
    return p.imagenUrl.startsWith('http') ? p.imagenUrl : `${this.data.apiBase}${p.imagenUrl}`;
  }

  badgeStock() {
    const p = this.data.producto;
    if (p.stock <= 0) return { clase: 'tf-tag tf-tag-rojo', texto: 'Agotado' };
    if (p.stock <= p.stockMinimo) return { clase: 'tf-tag tf-tag-naranja', texto: `Stock bajo (${p.stock})` };
    return { clase: 'tf-tag tf-tag-verde', texto: `En stock (${p.stock})` };
  }

  colorTipo(tipo: string) {
    return tipo === 'ENTRADA' ? '#2ecc71' : tipo === 'SALIDA' ? '#e74c3c' : '#95a5a6';
  }
}
