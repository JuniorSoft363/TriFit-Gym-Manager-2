import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MATERIAL } from '../../shared/material';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-historial-dialog',
  standalone: true,
  imports: [CommonModule, MATERIAL],
  templateUrl: './historial-dialog.component.html'
})
export class HistorialDialogComponent implements OnInit {
  cargando = true;
  historial: any = null;

  constructor(
    private api: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: { clienteId: number }
  ) {}

  ngOnInit() {
    this.api.get(`clientes/${this.data.clienteId}/historial`).subscribe({
      next: (res) => {
        this.historial = res;
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }
}
