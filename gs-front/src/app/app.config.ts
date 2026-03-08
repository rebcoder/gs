import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { APP_INITIALIZER } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

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
    }
  ]
};
