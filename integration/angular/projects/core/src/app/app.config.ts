import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideGraphQL } from './graphql/graphql.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGraphQL(),
    provideHttpClient(withFetch()),
    provideClientHydration(withHttpTransferCacheOptions({
      includePostRequests: true
    }))
  ]
};
