import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function base64UrlEncode(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
  const body = base64UrlEncode(payload);
  return `${header}.${body}.signature`;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    window.localStorage.clear();
  });

  it('allows navigation when a valid, non-expired token is stored', () => {
    const token = buildToken({ sub: 'demo_user', exp: Math.floor(Date.now() / 1000) + 3600 });
    window.localStorage.setItem('authToken', token);

    expect(guard.canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('blocks and redirects to /login when there is no token', () => {
    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('blocks and redirects to /login when the stored token is expired', () => {
    const token = buildToken({ sub: 'demo_user', exp: Math.floor(Date.now() / 1000) - 3600 });
    window.localStorage.setItem('authToken', token);

    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    // AuthService.getToken() clears an expired token as a side effect.
    expect(window.localStorage.getItem('authToken')).toBeNull();
  });
});
