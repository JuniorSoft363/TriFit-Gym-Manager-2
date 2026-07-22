import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-movimiento-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './movimiento-dialog.component.html'
})
export class MovimientoDialogComponent implements OnInit {
  form: FormGroup;
  productos: any[] = [];
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public ref: MatDialogRef<MovimientoDialogComponent>
  ) {
    this.form = this.fb.group({
      productoId: [null as number | null, Validators.required],
      tipo: ['ENTRADA', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      observacion: ['']
    });
  }

  ngOnInit() {
    this.api.listar('inventario/productos', { limit: 200 }).subscribe((res) => (this.productos = res.datos));
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    this.api.post('inventario/movimientos', this.form.value).subscribe({
      next: (res) => {
        this.guardando = false;
        this.ref.close(res);
      },
      error: () => (this.guardando = false)
    });
  }
}
