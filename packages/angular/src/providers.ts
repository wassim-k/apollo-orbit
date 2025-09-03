import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, provideEnvironmentInitializer, Provider, Type } from '@angular/core';
import { ApolloClient } from '@apollo/client';
import { Apollo } from './apollo';
import { APOLLO_CLIENT_FACTORY, apolloClientFactory } from './clientFactory';
import { ApolloRegistry } from './internal/apolloRegistry';
import { APOLLO_INSTANCE_FACTORY, ApolloInstanceFactory } from './internal/instanceFactory';
import { APOLLO_MULTI_ROOT, APOLLO_PROVIDED } from './tokens';
import { ApolloOptions, DefaultOptions } from './types';

export interface ApolloOrbitFeature {
  kind: `APOLLO_ORBIT_${string}`;
  providers: Array<Provider>;
}

export function withApolloOptions(options: ApolloOptions): ApolloOrbitFeature;
export function withApolloOptions(optionsFactory: () => ApolloOptions): ApolloOrbitFeature;
export function withApolloOptions(options: ApolloOptions | (() => ApolloOptions)): ApolloOrbitFeature {
  return {
    kind: 'APOLLO_ORBIT_OPTIONS',
    providers: getApolloInstanceProviders(Apollo, options)
  };
}

export function provideApollo(...features: Array<ApolloOrbitFeature>): EnvironmentProviders {
  return makeEnvironmentProviders([
    ApolloRegistry,
    { provide: Apollo, useFactory: () => apolloFactory(null) }, // guard
    { provide: APOLLO_PROVIDED, useValue: true },
    { provide: APOLLO_INSTANCE_FACTORY, useFactory: apolloInstanceFactory },
    { provide: APOLLO_CLIENT_FACTORY, useValue: apolloClientFactory },
    provideEnvironmentInitializer(apolloOrbitRootGuard),
    features.map(({ providers }) => providers)
  ]);
}

export function provideApolloInstance(token: Type<unknown> | InjectionToken<Apollo>, options: ApolloOptions | (() => ApolloOptions)): EnvironmentProviders {
  return makeEnvironmentProviders(getApolloInstanceProviders(token, options));
}

function getApolloInstanceProviders(token: Type<unknown> | InjectionToken<Apollo>, options: ApolloOptions | (() => ApolloOptions)): Array<Provider> {
  return [
    { provide: ENVIRONMENT_INITIALIZER, multi: true, useValue: () => inject(ApolloRegistry).register(token) },
    {
      provide: token,
      useFactory: typeof options === 'function'
        ? () => apolloFactory(options())
        : () => apolloFactory(options)
    }
  ];
}

function apolloInstanceFactory(): ApolloInstanceFactory {
  return (_clientId: string, client: ApolloClient, defaultOptions?: DefaultOptions): Apollo => new Apollo(client, defaultOptions);
}

function apolloFactory(options: ApolloOptions | null): Apollo {
  if (!options) throw new Error('withApolloOptions feature must be passed to provideApollo() before injecting Apollo');
  const { id = 'default', cache, defaultOptions, ...rest } = options;
  const createClient = inject(APOLLO_CLIENT_FACTORY);
  const client = createClient({ cache, defaultOptions, ...rest });
  return inject(APOLLO_INSTANCE_FACTORY)(id, client, defaultOptions);
}

function apolloOrbitRootGuard(): void {
  const isProvided = inject<boolean>(APOLLO_PROVIDED, { optional: true, skipSelf: true });
  const multiRoot = inject<boolean>(APOLLO_MULTI_ROOT, { optional: true });
  if (isProvided && multiRoot !== true) {
    throw new Error('provideApollo() should only be called once. To override this behaviour, may provide APOLLO_MULTI_ROOT token.');
  }
}
