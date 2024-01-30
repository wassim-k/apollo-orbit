import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Required for SSR to stabilise because of ApolloClient setting a 10s timeout for suggesting devtools in the console.
(globalThis as any).__DEV__ = false;

if (environment.production) {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err)); // eslint-disable-line no-console
});
