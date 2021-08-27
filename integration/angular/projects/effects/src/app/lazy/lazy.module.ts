import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ApolloOrbitModule } from '@apollo-orbit/angular';
import { LazyRoutingModule } from './lazy-routing.module';
import { LazyComponent } from './lazy.component';
import { LazyState } from './states/lazy/lazy.state';

@NgModule({
  declarations: [
    LazyComponent
  ],
  imports: [
    CommonModule,
    LazyRoutingModule,
    ApolloOrbitModule.forChild([LazyState])
  ]
})
export class LazyModule { }
