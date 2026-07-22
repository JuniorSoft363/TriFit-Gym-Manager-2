import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MATERIAL } from '../../shared/material';
import { CrudPageComponent, AccionExtra } from '../../shared/crud-page/crud-page.component';
import { Campo, Columna } from '../../shared/campos';
import { AsignarClientesDialogComponent } from './asignar-clientes-dialog.component';

@Component({
  selector: 'app-entrenadores',
  standalone: true,
  imports: [CommonModule, MATERIAL, CrudPageComponent],
  templateUrl: './entrenadores.component.html'
})
export class EntrenadoresComponent {
  columnas: Columna[] = [
    { clave: 'cedula', titulo: 'Cédula' },
    { clave: 'nombres', titulo: 'Nombres' },
    { clave: 'apellidos', titulo: 'Apellidos' },
    { clave: 'especialidad', titulo: 'Especialidad' },
    { clave: 'telefono', titulo: 'Teléfono' },
    { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
  ];

  campos: Campo[] = [
    { clave: 'cedula', etiqueta: 'Cédula', tipo: 'texto', requerido: true },
    { clave: 'nombres', etiqueta: 'Nombres', tipo: 'texto', requerido: true },
    { clave: 'apellidos', etiqueta: 'Apellidos', tipo: 'texto', requerido: true },
    { clave: 'especialidad', etiqueta: 'Especialidad', tipo: 'texto' },
    { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'texto', ancho: 'medio' },
    { clave: 'email', etiqueta: 'Correo', tipo: 'email', ancho: 'medio' }
  ];

  accionesExtra: AccionExtra[] = [
    { icono: 'groups', tooltip: 'Clientes asignados', accion: (fila) => this.abrirClientes(fila) }
  ];

  constructor(private dialog: MatDialog) {}

  abrirClientes(fila: any) {
    this.dialog.open(AsignarClientesDialogComponent, {
      width: '480px',
      data: { entrenadorId: fila.id, nombreEntrenador: `${fila.nombres} ${fila.apellidos}` }
    });
  }
}
