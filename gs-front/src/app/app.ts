import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'GarageSale';
  private auth = inject(AuthService);
  private router = inject(Router);
  searchQuery = '';
  locationQuery = '';

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  currentUsername(): string | null {
    return this.auth.getCurrentUser()?.username || null;
  }

  onSearch(): void {
    const params: any = {};
    if (this.locationQuery) params.location = this.locationQuery;
    if (this.searchQuery) params.q = this.searchQuery;
    const query = new URLSearchParams(params).toString();
    window.location.href = query ? `/home?${query}` : '/home';
  }

  onLogoClick(): void {
    // Always go Home
    this.router.navigate(['/home']);
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }

  clearDemo(): void {
    fetch(`${environment.apiBaseUrl}/api/test/clear-demo`, { method: 'POST' })
      .then(() => {
        // reload to reflect cleared data
        location.reload();
      })
      .catch(err => console.error('Failed to clear demo data', err));
  }

  // Dev helper: store token and redirect to browse (only active on localhost)
  autoLoginDemo(role: 'buyer' | 'seller' = 'buyer') {
    if (this.hostname !== 'localhost' && this.hostname !== '127.0.0.1') {
      console.warn('autoLoginDemo is only intended for localhost');
      return;
    }

    // pick token file from server side temp files created by our scripts
    fetch(`${environment.apiBaseUrl}/api/test/demo-info`)
      .then(() => fetch('/assets/blank.json')) // dummy fetch to keep promise chain
      .finally(() => {
        // read token from backend temp files via a dev-only endpoint is not available in prod,
        // so we use window.prompt to paste in the token quickly.
        const token = window.prompt('Paste demo token (seller or buyer) to auto-login:');
        if (token) {
          localStorage.setItem('authToken', token);
          window.location.href = '/home';
        }
      });
  }

  // Expose hostname to template
  get hostname(): string {
    return typeof window !== 'undefined' ? window.location.hostname : '';
  }
}
