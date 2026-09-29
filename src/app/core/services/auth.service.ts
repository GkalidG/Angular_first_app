import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly platformId = inject(PLATFORM_ID);
  private httpClient = inject(HttpClient);

  isAuthenticated(): boolean {
    return true;
  }

  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('auth_token');
      return token || 'bearerToken';
    }
    return 'bearerToken';
  }

  login() {}

  logout() {}
}
