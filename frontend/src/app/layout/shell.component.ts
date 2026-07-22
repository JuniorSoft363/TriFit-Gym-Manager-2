import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MATERIAL } from '../shared/material';
import { AuthService } from '../core/services/auth.service';
import { RolNombre } from '../core/models';

interface ItemMenu {
  ruta: string;
  etiqueta: string;
  icono: string;
  roles: RolNombre[];
}

const MENU: ItemMenu[] = [
  { ruta: 'dashboard', etiqueta: 'Dashboard', icono: 'dashboard', roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
  {
    ruta: 'clientes',
    etiqueta: 'Clientes',
    icono: 'groups',
    roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'ENTRENADOR']
  },
  {
    ruta: 'membresias',
    etiqueta: 'Planes y Membresías',
    icono: 'card_membership',
    roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
  },
  { ruta: 'pagos', etiqueta: 'Pagos', icono: 'payments', roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
  { ruta: 'asistencias', etiqueta: 'Asistencias', icono: 'how_to_reg', roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
  { ruta: 'entrenadores', etiqueta: 'Entrenadores', icono: 'sports', roles: ['ADMINISTRADOR'] },
  { ruta: 'rutinas', etiqueta: 'Rutinas', icono: 'fitness_center', roles: ['ADMINISTRADOR', 'ENTRENADOR'] },
  { ruta: 'inventario', etiqueta: 'Inventario', icono: 'inventory_2', roles: ['ADMINISTRADOR'] },
  { ruta: 'reportes', etiqueta: 'Reportes', icono: 'bar_chart', roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
  { ruta: 'configuracion', etiqueta: 'Configuración', icono: 'settings', roles: ['ADMINISTRADOR'] }
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MATERIAL],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  constructor(public auth: AuthService) {}

  get menu(): ItemMenu[] {
    const rol = this.auth.usuario()?.rol;
    return MENU.filter((item) => !rol || item.roles.includes(rol));
  }

  cerrarSesion() {
    this.auth.cerrarSesion();
  }
}
