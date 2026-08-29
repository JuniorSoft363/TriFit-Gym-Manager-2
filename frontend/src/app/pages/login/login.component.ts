import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL } from '../../shared/material';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MATERIAL],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  cargando = false;
  errorMsg = '';
  form: FormGroup;
  hidePassword = true;

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  enviar() {
    if (this.form.invalid) return;
    this.cargando = true;
    this.errorMsg = '';
    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: (res) => {
        this.auth.guardarSesion(res);
        this.cargando = false;
        const destino = res.usuario.rol === 'ENTRENADOR' ? '/app/clientes' : '/app/dashboard';
        this.router.navigateByUrl(destino);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMsg = err?.error?.mensaje || 'Credenciales incorrectas';
      }
    });
  }
}
