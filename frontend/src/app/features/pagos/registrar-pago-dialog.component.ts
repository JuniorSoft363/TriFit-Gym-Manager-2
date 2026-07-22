import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-registrar-pago-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './registrar-pago-dialog.component.html'
})
export class RegistrarPagoDialogComponent {
  form: FormGroup;
  buscando = false;
  guardando = false;
  cliente: any = null;
  membresia: any = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar,
    public ref: MatDialogRef<RegistrarPagoDialogComponent>
  ) {
    this.form = this.fb.group({
      cedula: ['', Validators.required],
      monto: [null as number | null, [Validators.required, Validators.min(0)]],
      metodo: ['EFECTIVO', Validators.required],
      observacion: ['']
    });
  }

  buscar() {
    const cedula = this.form.value.cedula;
    if (!cedula) return;
    this.buscando = true;
    this.cliente = null;
    this.membresia = null;
    this.api.get(`membresias/vigente/${cedula}`).subscribe({
      next: (res: any) => {
        this.cliente = res.cliente;
        this.membresia = res.membresia;
        this.buscando = false;
        if (this.membresia?.plan?.precio) {
          this.form.patchValue({ monto: this.membresia.plan.precio });
        }
        if (!this.membresia) {
          this.snack.open('El cliente no tiene membresías registradas', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => (this.buscando = false)
    });
  }

  guardar() {
    if (this.form.invalid || !this.membresia) return;
    this.guardando = true;
    const { monto, metodo, observacion } = this.form.value;
    this.api
      .post('pagos', { membresiaId: this.membresia.id, monto, metodo, observacion })
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.ref.close(res);
        },
        error: () => (this.guardando = false)
      });
  }
}
