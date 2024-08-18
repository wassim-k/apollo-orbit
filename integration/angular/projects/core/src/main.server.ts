import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Required for SSR to stabilise because of ApolloClient setting a 10s timeout for suggesting devtools in the console.
(globalThis as any).__DEV__ = false;

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
