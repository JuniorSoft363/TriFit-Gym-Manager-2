import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MATERIAL } from '../../shared/material';
import { CrudPageComponent, AccionExtra } from '../../shared/crud-page/crud-page.component';
import { Columna } from '../../shared/campos';
import { Campo } from '../../shared/campos';
import { AuthService } from '../../core/services/auth.service';
import { HistorialDialogComponent } from './historial-dialog.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, MATERIAL, CrudPageComponent],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent {
  columnas: Columna[] = [
    { clave: 'cedula', titulo: 'Cédula' },
    { clave: 'nombres', titulo: 'Nombres' },
    { clave: 'apellidos', titulo: 'Apellidos' },
    { clave: 'email', titulo: 'Correo' },
    { clave: 'telefono', titulo: 'Teléfono' },
    { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
  ];

  campos: Campo[] = [
    { clave: 'cedula', etiqueta: 'Cédula', tipo: 'texto', requerido: true },
    { clave: 'nombres', etiqueta: 'Nombres', tipo: 'texto', requerido: true },
    { clave: 'apellidos', etiqueta: 'Apellidos', tipo: 'texto', requerido: true },
    { clave: 'email', etiqueta: 'Correo', tipo: 'email' },
    { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'texto', ancho: 'medio' },
    { clave: 'direccion', etiqueta: 'Dirección', tipo: 'texto', ancho: 'medio' },
    { clave: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' }
  ];

  accionesExtra: AccionExtra[] = [
    { icono: 'history', tooltip: 'Ver historial', accion: (fila) => this.abrirHistorial(fila) }
  ];

  constructor(
    public auth: AuthService,
    private dialog: MatDialog
  ) {}

  get soloLectura(): boolean {
    return this.auth.tieneRol('ENTRENADOR');
  }

  abrirHistorial(fila: any) {
    this.dialog.open(HistorialDialogComponent, { width: '600px', data: { clienteId: fila.id } });
  }
}
