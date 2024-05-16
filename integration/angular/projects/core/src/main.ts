import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Required for SSR to stabilise because of ApolloClient setting a 10s timeout for suggesting devtools in the console.
(globalThis as any).__DEV__ = false;

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err)); // eslint-disable-line no-console
