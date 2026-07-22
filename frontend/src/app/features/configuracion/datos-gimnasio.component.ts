import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-datos-gimnasio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './datos-gimnasio.component.html'
})
export class DatosGimnasioComponent implements OnInit {
  form: FormGroup;
  cargando = true;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      direccion: [''],
      telefono: [''],
      email: [''],
      horario: ['']
    });
  }

  ngOnInit() {
    this.api.get('configuracion/gimnasio').subscribe({
      next: (res: any) => {
        this.form.patchValue(res);
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    this.api.put('configuracion/gimnasio', this.form.value).subscribe({
      next: () => {
        this.guardando = false;
        this.snack.open('Datos del gimnasio actualizados', 'Cerrar', { duration: 3000 });
      },
      error: () => (this.guardando = false)
    });
  }
}
