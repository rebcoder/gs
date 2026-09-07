import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  // Must match the backend's UserRegistrationDto field name exactly - Jackson matches by name with
  // no @JsonAlias, so a mismatch here silently drops the value instead of erroring.
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
}

export interface CurrentUser {
  id: number | null;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiBaseUrl}/api/auth`;

  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        map(response => {
          // Store token in localStorage
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        map(response => {
          // Store token in localStorage
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    if (this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getCurrentUser(): CurrentUser | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId ?? payload.id ?? null,
        username: payload.sub
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isTokenExpired(token?: string | null): boolean {
    const resolvedToken = token ?? localStorage.getItem('authToken');
    if (!resolvedToken) return true;
    try {
      const payload = JSON.parse(atob(resolvedToken.split('.')[1]));
      if (!payload?.exp) return false;
      const nowSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= nowSeconds;
    } catch {
      return true;
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && typeof error.error?.message === 'string') {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.status === 400) {
        errorMessage = 'Bad request - please check your input';
      } else if (error.status === 409) {
        errorMessage = 'User already exists';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
