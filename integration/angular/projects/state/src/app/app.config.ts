import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { provideConfig } from './config/config.provider';
import { provideGraphQL } from './graphql/graphql.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideGraphQL(),
    provideHttpClient(),
    provideRouter(APP_ROUTES),
    provideConfig()
  ]
};
