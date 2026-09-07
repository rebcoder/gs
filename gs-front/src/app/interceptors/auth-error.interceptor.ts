import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  private redirectingToLogin = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const hadStoredToken = !!localStorage.getItem('authToken');
    const token = this.authService.getToken();
    const authEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

    if (hadStoredToken && !token && !authEndpoint) {
      this.authService.logout();
      this.redirectToLoginOnce();
      return throwError(() => new Error('Session expired. Please login again.'));
    }

    const authReq = token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        const shouldHandleAsExpiredSession =
          !authEndpoint &&
          hadStoredToken &&
          (error.status === 401 || error.status === 403);

        if (shouldHandleAsExpiredSession) {
          this.authService.logout();
          this.redirectToLoginOnce();
          return throwError(() => new Error('Session expired. Please login again.'));
        }

        return throwError(() => new Error(this.resolveErrorMessage(error)));
      })
    );
  }

  private redirectToLoginOnce(): void {
    if (this.redirectingToLogin) {
      return;
    }
    this.redirectingToLogin = true;
    this.router.navigate(['/login'], { queryParams: { sessionExpired: '1' } })
      .finally(() => (this.redirectingToLogin = false));
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to reach server. Check your internet connection and backend status.';
    }

    const payload = error.error;
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
      if (payload.validationErrors && typeof payload.validationErrors === 'object') {
        const firstValidationError = Object.values(payload.validationErrors)[0];
        if (typeof firstValidationError === 'string' && firstValidationError.trim()) {
          return firstValidationError;
        }
      }
    }

    if (error.status === 400) return 'Invalid request. Please verify your input.';
    if (error.status === 404) return 'Requested resource was not found.';
    if (error.status === 429) return 'Too many requests. Please wait and retry.';
    if (error.status >= 500) return 'Server error. Please try again in a moment.';
    return 'Request failed. Please try again.';
  }
}
