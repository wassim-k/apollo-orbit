import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, Provider, Type } from '@angular/core';
import { ApolloClient } from '@apollo/client/core';
import { Apollo } from './apollo';
import { APOLLO_CLIENT_FACTORY, apolloClientFactory } from './clientFactory';
import { ApolloInstanceFactory } from './instanceFactory';
import { APOLLO_INSTANCE_FACTORY, APOLLO_MULTI_ROOT, APOLLO_PROVIDED } from './tokens';
import { ApolloOptions, DefaultOptions } from './types';

export interface ApolloOrbitFeature {
  kind: `APOLLO_ORBIT_${string}`;
  providers: Array<Provider>;
}

export const APOLLO_ORBIT_PROVIDERS: Array<Provider> = [
  [
    { provide: Apollo, useFactory: () => apolloFactory(null) }, // guard
    { provide: APOLLO_PROVIDED, useValue: true },
    { provide: APOLLO_INSTANCE_FACTORY, useFactory: apolloInstanceFactory },
    { provide: APOLLO_CLIENT_FACTORY, useValue: apolloClientFactory }
  ]
];

export function withApolloOptions(options: ApolloOptions): ApolloOrbitFeature;
export function withApolloOptions(optionsFactory: () => ApolloOptions): ApolloOrbitFeature;
export function withApolloOptions(options: ApolloOptions | (() => ApolloOptions)): ApolloOrbitFeature {
  return {
    kind: 'APOLLO_ORBIT_OPTIONS',
    providers: getApolloInstanceProviders(Apollo, options)
  };
}

export function provideApolloOrbit(...features: Array<ApolloOrbitFeature>): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...APOLLO_ORBIT_PROVIDERS,
    features.map(({ providers }) => providers),
    { provide: ENVIRONMENT_INITIALIZER, multi: true, useFactory: () => apolloOrbitRootGuard }
  ]);
}

export function provideApolloInstance(token: Type<unknown> | InjectionToken<Apollo>, options: ApolloOptions | (() => ApolloOptions)): EnvironmentProviders {
  return makeEnvironmentProviders(getApolloInstanceProviders(token, options));
}

function getApolloInstanceProviders(token: Type<unknown> | InjectionToken<Apollo<any>>, options: ApolloOptions<any> | (() => ApolloOptions)): Array<Provider> {
  return [
    typeof options === 'function'
      ? {
        provide: token,
        useFactory: () => apolloFactory(options())
      }
      : {
        provide: token,
        useFactory: () => apolloFactory(options)
      }
  ];
}

function apolloInstanceFactory(): ApolloInstanceFactory {
  return (_clientId: string, client: ApolloClient<any>, defaultOptions?: DefaultOptions): Apollo => new Apollo(client, defaultOptions);
}

function apolloFactory(options: ApolloOptions | null): Apollo {
  if (!options) throw new Error('withApolloOptions feature must be passed to provideApolloOrbit() before injecting Apollo');
  const { id = 'default', cache, defaultOptions, ...rest } = options;
  const createClient = inject(APOLLO_CLIENT_FACTORY);
  const client = createClient({ cache, defaultOptions, ...rest });
  return inject(APOLLO_INSTANCE_FACTORY)(id, client, defaultOptions);
}

function apolloOrbitRootGuard(): void {
  const isProvided = inject<boolean>(APOLLO_PROVIDED, { optional: true, skipSelf: true });
  const multiRoot = inject<boolean>(APOLLO_MULTI_ROOT, { optional: true });
  if (isProvided && multiRoot !== true) {
    throw new Error('provideApolloOrbit() has been called more than once. Consider calling provideStates() instead. Otherwise, you may provide APOLLO_MULTI_ROOT token.');
  }
}
