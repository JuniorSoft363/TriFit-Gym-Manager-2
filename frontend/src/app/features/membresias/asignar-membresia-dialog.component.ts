import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-asignar-membresia-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './asignar-membresia-dialog.component.html'
})
export class AsignarMembresiaDialogComponent implements OnInit {
  form: FormGroup;
  buscando = false;
  guardando = false;
  cliente: any = null;
  planes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar,
    public ref: MatDialogRef<AsignarMembresiaDialogComponent>
  ) {
    this.form = this.fb.group({
      cedula: ['', Validators.required],
      planId: [null as number | null, Validators.required],
      fechaInicio: [new Date()]
    });
  }

  ngOnInit() {
    this.api.listar('planes', { limit: 100 }).subscribe((res) => (this.planes = res.datos));
  }

  buscarCliente() {
    const cedula = this.form.value.cedula;
    if (!cedula) return;
    this.buscando = true;
    this.cliente = null;
    this.api.get(`clientes/cedula/${cedula}`).subscribe({
      next: (res) => {
        this.cliente = res;
        this.buscando = false;
      },
      error: () => {
        this.buscando = false;
        this.snack.open('Cliente no encontrado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  guardar() {
    if (this.form.invalid || !this.cliente) return;
    this.guardando = true;
    const { planId, fechaInicio } = this.form.value;
    this.api
      .post('membresias', { clienteId: this.cliente.id, planId, fechaInicio })
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.ref.close(res);
        },
        error: () => (this.guardando = false)
      });
  }
}
