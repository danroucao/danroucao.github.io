import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, TEST_ACCOUNT } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  loginError = '';
  testAccount = TEST_ACCOUNT;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: [TEST_ACCOUNT.email, [Validators.required, Validators.email]],
      password: [TEST_ACCOUNT.password, [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    const { email, password, rememberMe } = this.loginForm.value;

    setTimeout(() => {
      this.isLoading = false;
      const isLoggedIn = this.authService.login(email, password, rememberMe);

      if (!isLoggedIn) {
        this.loginError = '帳號或密碼錯誤，請使用測試帳密登入。';
        return;
      }

      const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/questionnaires';
      this.router.navigateByUrl(redirectTo);
    }, 500);
  }
}
