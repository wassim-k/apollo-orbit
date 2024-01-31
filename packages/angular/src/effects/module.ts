import { Inject, Injector, ModuleWithProviders, NgModule, ProviderToken } from '@angular/core';
import { ɵAPOLLO_INSTANCE_FACTORY as APOLLO_INSTANCE_FACTORY, Apollo as ApolloBase, ApolloClient, ɵApolloInstanceFactory as ApolloInstanceFactory, DefaultOptions } from '@apollo-orbit/angular/core';
import { StateDefinition, Type, flatten } from '@apollo-orbit/core';
import { Apollo } from './apollo';
import { StateClass, bindStateDefinition } from './decorators/internal';
import { StateManager } from './stateManager';
import { CHILD_STATES, ROOT_STATES } from './tokens';

@NgModule()
export class ApolloOrbitEffectsRootModule {
  public constructor(
    @Inject(ROOT_STATES) states: Array<Type<any>>,
    @Inject(Injector) injector: Injector,
    @Inject(StateManager) private readonly stateManager: StateManager
  ) {
    this.addStates([states], injector);
  }

  public addStates(states: Array<Array<Type<any>>>, injector: Injector): void {
    this.stateManager.onAddStates(this.instantiateStates(states, injector));
  }

  private instantiateStates(states: Array<Array<Type<any>>>, injector: Injector): Array<StateDefinition> {
    return flatten(states).map(state => this.instantiateState(state, injector));
  }

  private instantiateState(state: Type<any>, injector: Injector): StateDefinition {
    const instance = injector.get(state as ProviderToken<any>);
    return bindStateDefinition(state as StateClass, instance);
  }
}

@NgModule()
export class ApolloOrbitEffectsChildModule {
  public constructor(
    @Inject(ApolloOrbitEffectsRootModule) root: ApolloOrbitEffectsRootModule,
    @Inject(CHILD_STATES) states: Type<any>[][], // eslint-disable-line @typescript-eslint/array-type
    @Inject(Injector) injector: Injector
  ) {
    root.addStates(states, injector);
  }
}

export class ApolloOrbitEffectsModule {
  public static forRoot(states: Array<Type<any>> = []): ModuleWithProviders<ApolloOrbitEffectsRootModule> {
    return {
      ngModule: ApolloOrbitEffectsRootModule,
      providers: [
        ...states,
        StateManager,
        { provide: Apollo, useExisting: ApolloBase },
        { provide: APOLLO_INSTANCE_FACTORY, useFactory: apolloInstanceFactory, deps: [StateManager] },
        { provide: ROOT_STATES, useValue: states }
      ]
    };
  }

  public static forChild(states: Array<Type<any>>): ModuleWithProviders<ApolloOrbitEffectsChildModule> {
    return {
      ngModule: ApolloOrbitEffectsChildModule,
      providers: [
        ...states,
        { provide: CHILD_STATES, useValue: states, multi: true }
      ]
    };
  }
}

export function apolloInstanceFactory(stateManager: StateManager): ApolloInstanceFactory {
  return (clientId: string, client: ApolloClient<any>, defaultOptions?: DefaultOptions): Apollo => {
    const manager = stateManager.createManager(clientId, client);
    return new Apollo(client, manager, defaultOptions);
  };
}
