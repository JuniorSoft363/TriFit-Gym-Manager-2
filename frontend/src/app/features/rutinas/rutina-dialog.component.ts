import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

export interface RutinaDialogData {
  esEdicion: boolean;
  rutina?: any;
}

@Component({
  selector: 'app-rutina-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './rutina-dialog.component.html'
})
export class RutinaDialogComponent implements OnInit {
  form: FormGroup;
  entrenadores: any[] = [];
  ejerciciosDisponibles: any[] = [];
  cedulaCliente = '';
  clienteAsignado: any = null;
  buscandoCliente = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar,
    public ref: MatDialogRef<RutinaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RutinaDialogData
  ) {
    const r = data.rutina;
    this.form = this.fb.group({
      nombre: [r?.nombre || '', Validators.required],
      objetivo: [r?.objetivo || ''],
      descripcion: [r?.descripcion || ''],
      entrenadorId: [r?.entrenadorId || null],
      ejercicios: this.fb.array([])
    });
    if (r?.cliente) this.clienteAsignado = r.cliente;
    (r?.ejercicios || []).forEach((e: any) =>
      this.ejerciciosArray.push(
        this.fb.group({
          ejercicioId: [e.ejercicioId, Validators.required],
          series: [e.series, [Validators.required, Validators.min(1)]],
          repeticiones: [e.repeticiones, [Validators.required, Validators.min(1)]],
          observacion: [e.observacion || '']
        })
      )
    );
  }

  ngOnInit() {
    this.api.listar('entrenadores', { limit: 100 }).subscribe((res) => (this.entrenadores = res.datos));
    this.api.listar('ejercicios', { limit: 200 }).subscribe((res) => (this.ejerciciosDisponibles = res.datos));
  }

  get ejerciciosArray(): FormArray {
    return this.form.get('ejercicios') as FormArray;
  }

  agregarEjercicio() {
    this.ejerciciosArray.push(
      this.fb.group({
        ejercicioId: [null, Validators.required],
        series: [3, [Validators.required, Validators.min(1)]],
        repeticiones: [10, [Validators.required, Validators.min(1)]],
        observacion: ['']
      })
    );
  }

  quitarEjercicio(index: number) {
    this.ejerciciosArray.removeAt(index);
  }

  buscarCliente() {
    if (!this.cedulaCliente) return;
    this.buscandoCliente = true;
    this.api.get(`clientes/cedula/${this.cedulaCliente}`).subscribe({
      next: (res) => {
        this.clienteAsignado = res;
        this.buscandoCliente = false;
      },
      error: () => {
        this.buscandoCliente = false;
        this.snack.open('Cliente no encontrado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  quitarCliente() {
    this.clienteAsignado = null;
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    const valores = {
      ...this.form.value,
      clienteId: this.clienteAsignado?.id || null
    };

    const peticion = this.data.esEdicion
      ? this.api.editar('rutinas', this.data.rutina.id, valores)
      : this.api.crear('rutinas', valores);

    peticion.subscribe({
      next: (res) => {
        this.guardando = false;
        this.ref.close(res);
      },
      error: () => (this.guardando = false)
    });
  }
}
