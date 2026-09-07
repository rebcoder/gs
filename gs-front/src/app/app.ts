import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'GarageSale';
  currentYear = new Date().getFullYear();
  private auth = inject(AuthService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  httpLoading$: Observable<boolean> = this.loadingService.isLoading$;

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  currentUsername(): string | null {
    return this.auth.getCurrentUser()?.username || null;
  }

  onLogoClick(): void {
    this.router.navigate(['/home']);
  }

  // The interactive search/filter UI lives on the Discover page, which owns
  // the filter state (see DiscoverComponent + DiscoverFiltersSheetComponent).
  // The global header's search pill is a decorative entry point that routes
  // there rather than duplicating that state/UI at the app-shell level.
  onSearchPillClick(): void {
    this.router.navigate(['/browse']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  clearDemo(): void {
    fetch(`${environment.apiBaseUrl}/api/test/clear-demo`, { method: 'POST' })
      .then(() => {
        // reload to reflect cleared data
        location.reload();
      })
      .catch(err => console.error('Failed to clear demo data', err));
  }

  get hostname(): string {
    return typeof window !== 'undefined' ? window.location.hostname : '';
  }
}
