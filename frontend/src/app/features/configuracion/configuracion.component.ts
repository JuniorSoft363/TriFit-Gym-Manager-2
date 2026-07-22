import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL } from '../../shared/material';
import { CrudPageComponent } from '../../shared/crud-page/crud-page.component';
import { Campo, Columna } from '../../shared/campos';
import { ApiService } from '../../core/services/api.service';
import { DatosGimnasioComponent } from './datos-gimnasio.component';
import { AuditoriaComponent } from './auditoria.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, MATERIAL, CrudPageComponent, DatosGimnasioComponent, AuditoriaComponent],
  templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent implements OnInit {
  columnasUsuarios: Columna[] = [
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'email', titulo: 'Correo' },
    { clave: 'rol.nombre', titulo: 'Rol' },
    { clave: 'activo', titulo: 'Activo', tipo: 'booleano' }
  ];

  camposUsuarios: Campo[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('usuarios/roles').subscribe((roles) => {
      this.camposUsuarios = [
        { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
        { clave: 'email', etiqueta: 'Correo', tipo: 'email', requerido: true },
        {
          clave: 'password',
          etiqueta: 'Contraseña',
          tipo: 'password',
          requerido: true,
          soloCrear: true,
          placeholder: 'Dejar en blanco para mantener la actual'
        },
        {
          clave: 'rolId',
          etiqueta: 'Rol',
          tipo: 'select',
          requerido: true,
          ancho: 'medio',
          opciones: roles.map((r) => ({ valor: r.id, etiqueta: r.nombre }))
        },
        { clave: 'activo', etiqueta: 'Usuario activo', tipo: 'checkbox', ancho: 'medio' }
      ];
    });
  }
}
