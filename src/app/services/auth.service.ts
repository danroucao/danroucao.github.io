import { Injectable } from '@angular/core';

export const TEST_ACCOUNT = {
  email: 'test@example.com',
  password: 'password123'
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'questionnaireTestUser';

  login(email: string, password: string, rememberMe: boolean): boolean {
    const isValid =
      email.trim().toLowerCase() === TEST_ACCOUNT.email &&
      password === TEST_ACCOUNT.password;

    if (!isValid) {
      return false;
    }

    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        email: TEST_ACCOUNT.email,
        rememberMe,
        loggedInAt: new Date().toISOString()
      })
    );

    return true;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  getUser(): { email: string; rememberMe?: boolean; loggedInAt?: string } | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
