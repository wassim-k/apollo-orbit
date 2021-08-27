import { ModuleWithProviders, NgModule } from '@angular/core';
import { ApolloOrbitModule as ApolloOrbitCoreModule } from '@apollo-orbit/angular/core';
import { Type } from '@apollo-orbit/core';
import { ApolloOrbitEffectsChildModule, ApolloOrbitEffectsModule, ApolloOrbitEffectsRootModule } from './effects/module';

@NgModule({
  imports: [
    ApolloOrbitCoreModule,
    ApolloOrbitEffectsRootModule
  ]
})
export class ApolloOrbitRootModule { }

export class ApolloOrbitModule {
  public static forRoot(states?: Array<Type<any>>): ModuleWithProviders<ApolloOrbitRootModule> {
    const { providers } = ApolloOrbitEffectsModule.forRoot(states);
    return {
      ngModule: ApolloOrbitRootModule,
      providers
    };
  }

  public static forChild(states: Array<Type<any>>): ModuleWithProviders<ApolloOrbitEffectsChildModule> {
    return ApolloOrbitEffectsModule.forChild(states);
  }
}
