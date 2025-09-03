import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: 'lazy',
    loadChildren: () => import('./lazy/lazy.routes').then(m => m.LAZY_ROUTES)
  }
];
