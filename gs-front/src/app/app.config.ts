import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { APP_INITIALIZER } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AuthErrorInterceptor } from './interceptors/auth-error.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

/** Placeholder shipped in environment.prod.ts — a real deploy must override it. */
const PLACEHOLDER_PROD_API_BASE_URL = 'https://your-backend-domain.example.com';

/**
 * Guards against shipping a production build that is still pointed at the
 * placeholder backend URL. If this fires, the app is deliberately prevented
 * from starting so a misconfigured deploy fails loudly instead of silently
 * calling a non-existent host.
 */
function assertProductionApiBaseUrlConfigured(): void {
  if (environment.production && environment.apiBaseUrl === PLACEHOLDER_PROD_API_BASE_URL) {
    const message =
      'FATAL CONFIGURATION ERROR: this production build is still pointed at the ' +
      `placeholder API URL ("${PLACEHOLDER_PROD_API_BASE_URL}"). Set a real ` +
      '"apiBaseUrl" in src/environments/environment.prod.ts before deploying. ' +
      'Refusing to start the app.';
    // eslint-disable-next-line no-console
    console.error(`\n\n${'='.repeat(80)}\n${message}\n${'='.repeat(80)}\n\n`);
    throw new Error(message);
  }
}

assertProductionApiBaseUrlConfigured();

export function seedDemoFactory(http: HttpClient) {
  return () => {
    try {
      if (environment.seedDemoOnStartup && location.hostname === 'localhost') {
        return http.post(`${environment.apiBaseUrl}/api/test/seed-demo`, {}).toPromise().catch(() => null);
      }
    } catch (e) {
      return Promise.resolve(null);
    }
    return Promise.resolve(null);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideClientHydration(),
    provideNativeDateAdapter(),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: {
        fontSet: 'material-icons'
      }
    },
    {
      provide: APP_INITIALIZER,
      useFactory: seedDemoFactory,
      deps: [HttpClient],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
};
