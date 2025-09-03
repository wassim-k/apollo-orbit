import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideGraphQL } from './graphql/graphql.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideGraphQL(),
    provideHttpClient(withFetch()),
    provideClientHydration(withHttpTransferCacheOptions({
      includePostRequests: true
    }))
  ]
};
