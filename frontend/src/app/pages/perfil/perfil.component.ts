import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MATERIAL } from '../../shared/material';
import { AuthService } from '../../core/services/auth.service';
import { PerfilCompleto } from '../../core/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MATERIAL],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  cargando = false;
  guardandoDatos = false;
  guardandoPassword = false;
  subiendoFoto = false;

  mensajeExito = '';
  errorMsg = '';
  passwordErrorMsg = '';
  hideActual = true;
  hideNueva = true;
  hideConfirmar = true;

  perfil = signal<PerfilCompleto | null>(null);
  datosForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.datosForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.maxLength(30)]],
      direccion: ['', [Validators.maxLength(200)]]
    });

    this.passwordForm = this.fb.group(
      {
        passwordActual: ['', [Validators.required]],
        passwordNuevo: ['', [Validators.required, Validators.minLength(6)]],
        confirmar: ['', [Validators.required]]
      },
      { validators: this.coincidenValidator }
    );
  }

  coincidenValidator = (group: FormGroup) => {
    const nueva = group.get('passwordNuevo')?.value;
    const confirmar = group.get('confirmar')?.value;
    return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
  };

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.auth.obtenerPerfil().subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.datosForm.patchValue({
          nombre: p.nombre,
          email: p.email,
          telefono: p.telefono || '',
          direccion: p.direccion || ''
        });
        this.cargando = false;
      },
      error: () => {
        this.errorMsg = 'No se pudo cargar el perfil';
        this.cargando = false;
      }
    });
  }

  guardarDatos() {
    if (this.datosForm.invalid) {
      this.datosForm.markAllAsTouched();
      return;
    }
    this.guardandoDatos = true;
    this.mensajeExito = '';
    this.errorMsg = '';
    this.auth.actualizarPerfil(this.datosForm.value).subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.auth.actualizarSesion({
          nombre: p.nombre,
          email: p.email,
          telefono: p.telefono,
          direccion: p.direccion,
          fotoUrl: p.fotoUrl
        });
        this.guardandoDatos = false;
        this.mensajeExito = 'Datos actualizados correctamente';
        setTimeout(() => (this.mensajeExito = ''), 3500);
      },
      error: (err) => {
        this.guardandoDatos = false;
        this.errorMsg = err?.error?.mensaje || 'No se pudieron guardar los cambios';
      }
    });
  }

  cambiarPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.guardandoPassword = true;
    this.passwordErrorMsg = '';
    const { passwordActual, passwordNuevo } = this.passwordForm.value;
    this.auth.cambiarPassword(passwordActual, passwordNuevo).subscribe({
      next: () => {
        this.guardandoPassword = false;
        this.passwordForm.reset();
        this.auth.actualizarSesion({ debeCambiarPassword: false });
        this.perfil.update((p) => (p ? { ...p, debeCambiarPassword: false } : p));
        this.mensajeExito = 'Contraseña actualizada correctamente';
        setTimeout(() => (this.mensajeExito = ''), 3500);
      },
      error: (err) => {
        this.guardandoPassword = false;
        this.passwordErrorMsg = err?.error?.mensaje || 'No se pudo cambiar la contraseña';
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.subiendoFoto = true;
    this.errorMsg = '';
    this.auth.subirFoto(archivo).subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.auth.actualizarSesion({ fotoUrl: p.fotoUrl });
        this.subiendoFoto = false;
        this.mensajeExito = 'Foto de perfil actualizada';
        setTimeout(() => (this.mensajeExito = ''), 3500);
      },
      error: (err) => {
        this.subiendoFoto = false;
        this.errorMsg = err?.error?.mensaje || 'No se pudo subir la imagen';
      }
    });
    input.value = '';
  }

  iniciales(): string {
    const nombre = this.perfil()?.nombre || this.auth.usuario()?.nombre || '';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  urlFoto(): string | null {
    return this.auth.urlFoto(this.perfil()?.fotoUrl);
  }
}
