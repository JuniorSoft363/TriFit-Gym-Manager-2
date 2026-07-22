import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'clientes',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'ENTRENADOR'] },
        loadComponent: () => import('./features/clientes/clientes.component').then((m) => m.ClientesComponent)
      },
      {
        path: 'membresias',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
        loadComponent: () =>
          import('./features/membresias/membresias.component').then((m) => m.MembresiasComponent)
      },
      {
        path: 'pagos',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
        loadComponent: () => import('./features/pagos/pagos.component').then((m) => m.PagosComponent)
      },
      {
        path: 'asistencias',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
        loadComponent: () =>
          import('./features/asistencias/asistencias.component').then((m) => m.AsistenciasComponent)
      },
      {
        path: 'entrenadores',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
        loadComponent: () =>
          import('./features/entrenadores/entrenadores.component').then((m) => m.EntrenadoresComponent)
      },
      {
        path: 'rutinas',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR', 'ENTRENADOR'] },
        loadComponent: () => import('./features/rutinas/rutinas.component').then((m) => m.RutinasComponent)
      },
      {
        path: 'inventario',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
        loadComponent: () =>
          import('./features/inventario/inventario.component').then((m) => m.InventarioComponent)
      },
      {
        path: 'reportes',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
        loadComponent: () => import('./features/reportes/reportes.component').then((m) => m.ReportesComponent)
      },
      {
        path: 'configuracion',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
