import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL } from '../material';
import { Campo } from '../campos';

export interface CrudDialogData {
  titulo: string;
  campos: Campo[];
  valores?: any;
  esEdicion: boolean;
}

@Component({
  selector: 'app-crud-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="tf-form-grid">
        <ng-container *ngFor="let campo of data.campos">
          <mat-checkbox
            *ngIf="campo.tipo === 'checkbox'"
            [formControlName]="campo.clave"
            [class.tf-full-width]="campo.ancho !== 'medio'"
            style="margin: 12px 0"
          >
            {{ campo.etiqueta }}
          </mat-checkbox>

          <mat-form-field
            *ngIf="campo.tipo === 'select'"
            appearance="outline"
            [class.tf-full-width]="campo.ancho !== 'medio'"
          >
            <mat-label>{{ campo.etiqueta }}</mat-label>
            <mat-select [formControlName]="campo.clave">
              <mat-option *ngFor="let op of campo.opciones" [value]="op.valor">{{ op.etiqueta }}</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get(campo.clave)?.hasError('required')">Campo obligatorio</mat-error>
          </mat-form-field>

          <mat-form-field
            *ngIf="campo.tipo === 'textarea'"
            appearance="outline"
            [class.tf-full-width]="campo.ancho !== 'medio'"
          >
            <mat-label>{{ campo.etiqueta }}</mat-label>
            <textarea matInput rows="3" [formControlName]="campo.clave"></textarea>
            <mat-error *ngIf="form.get(campo.clave)?.hasError('required')">Campo obligatorio</mat-error>
          </mat-form-field>

          <mat-form-field
            *ngIf="campo.tipo === 'fecha'"
            appearance="outline"
            [class.tf-full-width]="campo.ancho !== 'medio'"
          >
            <mat-label>{{ campo.etiqueta }}</mat-label>
            <input matInput [matDatepicker]="picker" [formControlName]="campo.clave" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get(campo.clave)?.hasError('required')">Campo obligatorio</mat-error>
          </mat-form-field>

          <mat-form-field
            *ngIf="['texto', 'numero', 'email', 'password'].includes(campo.tipo)"
            appearance="outline"
            [class.tf-full-width]="campo.ancho !== 'medio'"
          >
            <mat-label>{{ campo.etiqueta }}</mat-label>
            <input
              matInput
              [type]="campo.tipo === 'numero' ? 'number' : campo.tipo"
              [placeholder]="campo.placeholder || ''"
              [formControlName]="campo.clave"
            />
            <mat-error *ngIf="form.get(campo.clave)?.hasError('required')">Campo obligatorio</mat-error>
            <mat-error *ngIf="form.get(campo.clave)?.hasError('email')">Correo inválido</mat-error>
          </mat-form-field>
        </ng-container>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">Guardar</button>
    </mat-dialog-actions>
  `
})
export class CrudDialogComponent {
  form: FormGroup;

  constructor(
    public ref: MatDialogRef<CrudDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: CrudDialogData
  ) {
    const controles: Record<string, any> = {};
    for (const campo of data.campos) {
      const valorInicial = data.valores ? data.valores[campo.clave] ?? null : campo.tipo === 'checkbox' ? false : null;
      const validadores = [];
      const esRequerido = campo.requerido && !(campo.soloCrear && data.esEdicion);
      if (esRequerido) validadores.push(Validators.required);
      if (campo.tipo === 'email') validadores.push(Validators.email);
      controles[campo.clave] = [
        campo.tipo === 'fecha' && valorInicial ? new Date(valorInicial) : valorInicial,
        validadores
      ];
    }
    this.form = this.fb.group(controles);
  }

  guardar() {
    if (this.form.invalid) return;
    const salida = { ...this.form.value };
    if (this.data.esEdicion && 'password' in salida && !salida.password) {
      delete salida.password;
    }
    this.ref.close(salida);
  }
}
