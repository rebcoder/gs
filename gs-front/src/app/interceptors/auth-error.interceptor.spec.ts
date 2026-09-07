import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthErrorInterceptor } from './auth-error.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        AuthService,
        { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    window.localStorage.clear();
  });

  afterEach(() => httpMock.verify());

  it('adds Authorization header when token exists', () => {
    spyOn(auth, 'getToken').and.returnValue('t1');
    window.localStorage.setItem('authToken', 't1');

    http.get('/api/garage-sales').subscribe();
    const req = httpMock.expectOne('/api/garage-sales');
    expect(req.request.headers.get('Authorization')).toBe('Bearer t1');
    req.flush([]);
  });

  it('redirects to login on 401 when token was stored', (done) => {
    spyOn(auth, 'getToken').and.returnValue('t1');
    spyOn(auth, 'logout').and.callThrough();
    window.localStorage.setItem('authToken', 't1');

    http.get('/api/garage-sales').subscribe({
      next: () => fail('expected error'),
      error: (e) => {
        expect(String(e.message)).toContain('Session expired');
        expect(router.navigate).toHaveBeenCalled();
        done();
      }
    });

    const req = httpMock.expectOne('/api/garage-sales');
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });
  });
});

