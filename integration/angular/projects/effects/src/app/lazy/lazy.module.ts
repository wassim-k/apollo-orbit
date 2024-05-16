import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { provideStates } from '@apollo-orbit/angular';
import { LazyRoutingModule } from './lazy-routing.module';
import { LazyComponent } from './lazy.component';
import { lazyState } from './states/lazy/lazy.state';

@NgModule({
  declarations: [
    LazyComponent
  ],
  imports: [
    CommonModule,
    LazyRoutingModule
  ],
  providers: [
    provideStates(lazyState)
  ]
})
export class LazyModule { }
