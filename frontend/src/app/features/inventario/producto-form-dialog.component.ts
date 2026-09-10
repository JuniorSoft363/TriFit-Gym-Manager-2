import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-producto-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MATERIAL],
  templateUrl: './producto-form-dialog.component.html',
  styleUrl: './producto-form-dialog.component.scss'
})
export class ProductoFormDialogComponent implements OnInit {
  form: FormGroup;
  proveedores: any[] = [];
  guardando = signal(false);
  subiendo = signal(false);
  imagenPreview = signal<string | null>(null);
  imagenFile: File | null = null;
  imagenRemota: string | null = null;
  apiBase = '';
  esEdicion = false;

  codigoBarras = '';
  buscandoCodigo = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { producto?: any },
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar,
    public ref: MatDialogRef<ProductoFormDialogComponent>
  ) {
    this.esEdicion = !!data?.producto;
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      tipo: ['PRODUCTO', Validators.required],
      descripcion: [''],
      precio: [null],
      stock: [0, [Validators.min(0)]],
      stockMinimo: [0, [Validators.min(0)]],
      proveedorId: [null],
      activo: [true]
    });
  }

  ngOnInit() {
    this.api.listar('inventario/proveedores', { limit: 100 }).subscribe((res: any) => {
      this.proveedores = res.datos;
    });
    if (this.data.producto) {
      this.form.patchValue(this.data.producto);
      if (this.data.producto.imagenUrl) {
        this.imagenPreview.set(this.urlImagen(this.data.producto.imagenUrl));
      }
    }
  }

  urlImagen(img: string | null): string | null {
    if (!img) return null;
    return img.startsWith('http') ? img : `${this.apiBase}${img}`;
  }

  buscarPorCodigo() {
    const codigo = this.codigoBarras.trim();
    if (codigo.length < 6) return;
    this.buscandoCodigo.set(true);
    this.api.get(`inventario/codigo-barras/${codigo}`).subscribe({
      next: (res: any) => {
        this.buscandoCodigo.set(false);
        this.form.patchValue({
          nombre: res.nombre || this.form.value.nombre,
          descripcion: res.descripcion || this.form.value.descripcion
        });
        if (res.imagenUrl) {
          this.imagenRemota = res.imagenUrl;
          this.imagenFile = null;
          this.imagenPreview.set(this.urlImagen(res.imagenUrl));
        }
        this.snack.open(`Datos traídos de ${res.fuente}`, 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.buscandoCodigo.set(false);
        this.snack.open(err?.error?.mensaje || 'No se encontró el producto', 'Cerrar', { duration: 4000 });
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.imagenRemota = null;
    if (!archivo.type.startsWith('image/')) {
      this.ref.close({ mensaje: 'Solo se permiten imágenes' });
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.ref.close({ mensaje: 'La imagen no puede superar 5MB' });
      return;
    }
    this.imagenFile = archivo;
    const reader = new FileReader();
    reader.onload = (e) => this.imagenPreview.set(e.target?.result as string);
    reader.readAsDataURL(archivo);
  }

  eliminarImagenPreview() {
    this.imagenFile = null;
    this.imagenRemota = null;
    this.imagenPreview.set(null);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = { ...this.form.value };
    if (datos.precio === null || datos.precio === '') datos.precio = null;
    if (datos.proveedorId === null || datos.proveedorId === '') datos.proveedorId = null;
    // Imagen traída por código de barras (ya guardada en el servidor).
    if (this.imagenRemota && !this.imagenFile) datos.imagenUrl = this.imagenRemota;

    const obs = this.esEdicion
      ? this.api.editar('inventario/productos', this.data.producto.id, datos)
      : this.api.crear('inventario/productos', datos);

    obs.subscribe({
      next: (prod: any) => {
        if (this.imagenFile) {
          this.subirImagen(prod.id);
        } else {
          this.guardando.set(false);
          this.ref.close({ ok: true, mensaje: this.esEdicion ? 'Producto actualizado' : 'Producto creado' });
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.ref.close({ mensaje: err?.error?.mensaje || 'Error al guardar' });
      }
    });
  }

  subirImagen(productoId: number) {
    this.subiendo.set(true);
    const fd = new FormData();
    fd.append('imagen', this.imagenFile!);
    this.api.post(`inventario/productos/${productoId}/imagen`, fd).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.guardando.set(false);
        this.ref.close({ ok: true, mensaje: this.esEdicion ? 'Producto actualizado' : 'Producto creado' });
      },
      error: (err) => {
        this.subiendo.set(false);
        this.guardando.set(false);
        this.ref.close({ mensaje: err?.error?.mensaje || 'Producto guardado pero no se pudo subir la imagen' });
      }
    });
  }
}
