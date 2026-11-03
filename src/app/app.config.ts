import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { provideNgxMask } from 'ngx-mask';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { mockApiInterceptor, USAR_MOCK_API } from './core/mock/mock-api';
import { PRIMENG_PT_BR } from './core/primeng-pt-br';

// Datas e números em português (pipes date/number)
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 21 é zoneless por padrão: não use provideZoneChangeDetection sem o zone.js instalado
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      // O mock responde no lugar da API enquanto não há back-end (USAR_MOCK_API em core/mock/mock-api.ts)
      withInterceptors(USAR_MOCK_API ? [authInterceptor, mockApiInterceptor] : [authInterceptor]),
    ),
    provideNgxMask(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    // Toast (<p-toast>) e diálogo de confirmação (<p-confirmdialog>) usados em várias telas
    MessageService,
    ConfirmationService,
    providePrimeNG({
      ripple: true,
      translation: PRIMENG_PT_BR,
      theme: {
        // Tema base do PrimeNG; as cores da marca ficam no styles.css e no CSS de cada componente
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
  ],
};
