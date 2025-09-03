import { Routes } from '@angular/router';
import { provideStates } from '@apollo-orbit/angular/state';
import { LazyComponent } from './lazy.component';
import { lazyState } from './states/lazy/lazy.state';

export const LAZY_ROUTES: Routes = [
  {
    path: '',
    component: LazyComponent,
    providers: [
      provideStates(lazyState)
    ]
  }
];
