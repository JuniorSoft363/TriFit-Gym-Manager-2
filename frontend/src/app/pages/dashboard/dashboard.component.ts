import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

interface Resumen {
  clientesActivos: number;
  membresiasActivas: number;
  membresiasPorVencer: number;
  asistenciasHoy: number;
  ingresosDia: number;
  ingresosMes: number;
  ultimosPagos: any[];
}

interface Acceso {
  ruta: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MATERIAL],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  resumen: Resumen | null = null;
  cargando = true;
  columnasPagos = ['cliente', 'plan', 'monto', 'metodo', 'estado', 'fecha'];

  accesosRapidos: Acceso[] = [
    { ruta: '/app/clientes', etiqueta: 'Clientes', icono: 'groups' },
    { ruta: '/app/pagos', etiqueta: 'Pagos', icono: 'payments' },
    { ruta: '/app/membresias', etiqueta: 'Membresías', icono: 'card_membership' },
    { ruta: '/app/asistencias', etiqueta: 'Asistencias', icono: 'how_to_reg' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<Resumen>('dashboard/resumen').subscribe({
      next: (res) => {
        this.resumen = res;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  colorEstado(estado: string): string {
    const mapa: Record<string, string> = {
      COMPLETADO: '#2e7d32',
      PENDIENTE: '#e65100',
      CANCELADO: '#c62828',
      REEMBOLSADO: '#1565c0'
    };
    return mapa[estado] || '#607d8b';
  }
}
