import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { MATERIAL } from '../material';
import { ApiService } from '../../core/services/api.service';
import { GrupoBusqueda, ItemBusqueda, RespuestaBusqueda } from '../../core/models';

interface OpcionBusqueda extends ItemBusqueda {
  grupo: GrupoBusqueda;
}

@Component({
  selector: 'app-busqueda-global',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './busqueda-global.component.html',
  styleUrl: './busqueda-global.component.scss'
})
export class BusquedaGlobalComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  control = new FormControl('');
  grupos = signal<GrupoBusqueda[]>([]);
  cargando = signal(false);
  total = signal(0);

  constructor() {
    this.control.valueChanges
      .pipe(
        debounceTime(250),
        map((v) => (typeof v === 'string' ? v.trim() : '')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((q) => {
        if (q.length < 2) {
          this.grupos.set([]);
          this.total.set(0);
          this.cargando.set(false);
          return;
        }
        this.cargando.set(true);
        this.buscar(q);
      });
  }

  private buscar(q: string) {
    this.api.get<RespuestaBusqueda>('busqueda', { q }).subscribe({
      next: (res) => {
        this.grupos.set(res.grupos || []);
        this.total.set(res.total || 0);
        this.cargando.set(false);
      },
      error: () => {
        this.grupos.set([]);
        this.total.set(0);
        this.cargando.set(false);
      }
    });
  }

  mostrar = () => '';

  seleccionar(ev: MatAutocompleteSelectedEvent) {
    const opcion = ev.option.value as OpcionBusqueda;
    if (!opcion?.grupo) return;
    this.router.navigate([opcion.grupo.ruta], { queryParams: { busqueda: opcion.titulo } });
    this.control.setValue('', { emitEvent: false });
    this.grupos.set([]);
    this.total.set(0);
  }

  opcionesDe(grupo: GrupoBusqueda): OpcionBusqueda[] {
    return grupo.datos.map((d) => ({ ...d, grupo }));
  }

  iconoGrupo(tipo: string): string {
    const mapa: Record<string, string> = {
      cliente: 'groups',
      plan: 'card_membership',
      membresia: 'badge',
      entrenador: 'sports',
      producto: 'inventory_2',
      ejercicio: 'fitness_center'
    };
    return mapa[tipo] || 'search';
  }
}
