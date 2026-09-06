import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MATERIAL } from '../../shared/material';
import { RevealDirective } from '../../shared/reveal.directive';
import { CountUpDirective } from '../../shared/count-up.directive';
import { ApiService } from '../../core/services/api.service';

interface DatosGimnasio {
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  horario?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MATERIAL, RevealDirective, CountUpDirective],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  currentYear = new Date().getFullYear();
  gimnasio: DatosGimnasio | null = null;

  stats = [
    { valor: 500, sufijo: '+', etiqueta: 'Miembros activos' },
    { valor: 15, sufijo: '', etiqueta: 'Entrenadores certificados' },
    { valor: 40, sufijo: '+', etiqueta: 'Clases a la semana' },
    { valor: 6, sufijo: ' días', etiqueta: 'Abierto por semana' }
  ];

  beneficios = [
    { icono: 'monitoring', titulo: 'Control Total', desc: 'Gestiona tu membresía, asistencias y pagos desde un solo lugar.' },
    { icono: 'trending_up', titulo: 'Seguimiento Real', desc: 'Monitorea tu progreso con reportes detallados de tu rendimiento.' },
    { icono: 'support_agent', titulo: 'Soporte Dedicado', desc: 'Equipo de entrenadores certificados listos para ayudarte.' },
    { icono: 'devices', titulo: 'Multiplataforma', desc: 'Accede desde cualquier dispositivo, en cualquier momento.' }
  ];

  servicios = [
    { icono: 'fitness_center', titulo: 'Musculación', desc: 'Equipos completos para entrenamiento de fuerza y resistencia.' },
    { icono: 'directions_run', titulo: 'Cardio', desc: 'Zona de cardio equipada para mejorar tu condición física.' },
    { icono: 'sports_kabaddi', titulo: 'Entrenamiento Personalizado', desc: 'Rutinas guiadas por entrenadores certificados.' },
    { icono: 'restaurant', titulo: 'Nutrición', desc: 'Acompañamiento nutricional para potenciar tus resultados.' }
  ];

  contactos: { icono: string; etiqueta: string; valor: string }[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<DatosGimnasio>('configuracion/publico').subscribe({
      next: (res) => {
        this.gimnasio = res;
        this.contactos = [
          { icono: 'place', etiqueta: 'Dirección', valor: res.direccion || 'Dirección no configurada' },
          { icono: 'call', etiqueta: 'Teléfono', valor: res.telefono || '—' },
          { icono: 'mail', etiqueta: 'Email', valor: res.email || '—' },
          { icono: 'schedule', etiqueta: 'Horario', valor: res.horario || 'Lun - Vie: 6am - 10pm' }
        ];
      },
      error: () => {
        this.contactos = [
          { icono: 'place', etiqueta: 'Dirección', valor: 'Dirección no configurada' },
          { icono: 'call', etiqueta: 'Teléfono', valor: '—' },
          { icono: 'mail', etiqueta: 'Email', valor: '—' },
          { icono: 'schedule', etiqueta: 'Horario', valor: 'Lun - Vie: 6am - 10pm' }
        ];
      }
    });
  }
}
