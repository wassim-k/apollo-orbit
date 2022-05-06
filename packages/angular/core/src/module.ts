import { Inject, inject, ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { ApolloClient } from '@apollo/client/core';
import { Apollo } from './apollo';
import { apolloClientFactory, APOLLO_CLIENT_FACTORY } from './clientFactory';
import { ApolloInstanceFactory } from './instanceFactory';
import { APOLLO_INSTANCE_FACTORY, APOLLO_MULTI_ROOT, APOLLO_OPTIONS, APOLLO_OPTIONS_INTERNAL } from './tokens';
import { ApolloOptions, DefaultOptions } from './types';

@NgModule({
  providers: [
    { provide: APOLLO_INSTANCE_FACTORY, useFactory: apolloInstanceFactory },
    { provide: APOLLO_CLIENT_FACTORY, useValue: apolloClientFactory },
    { provide: APOLLO_OPTIONS_INTERNAL, useFactory: apolloOptionsFactory, deps: [[new Optional(), APOLLO_OPTIONS]] },
    { provide: Apollo, useFactory: apolloFactory, deps: [APOLLO_OPTIONS_INTERNAL] }
  ]
})
export class ApolloOrbitModule {
  public constructor(
    @Inject(ApolloOrbitModule) @Optional() @SkipSelf() parentModule?: ApolloOrbitModule,
    @Inject(APOLLO_MULTI_ROOT) @Optional() multiRoot?: boolean
  ) {
    if (!!parentModule && multiRoot !== true) {
      throw new Error('ApolloOrbitModule.forRoot has been called twice. Consider using ApolloOrbitModule.forChild. Otherwise, you may provide APOLLO_MULTI_ROOT token.');
    }
  }

  public static forRoot(): ModuleWithProviders<ApolloOrbitModule> {
    return {
      ngModule: ApolloOrbitModule
    };
  }
}

export function apolloOptionsFactory(options: ApolloOptions | null): ApolloOptions {
  if (!options) throw new Error('APOLLO_OPTIONS must be provided in order to use Apollo service');
  return options;
}

export function apolloFactory(options: ApolloOptions): Apollo {
  const { id = 'default', cache, defaultOptions, ...rest } = options;
  const createClient = inject(APOLLO_CLIENT_FACTORY);
  const client = createClient({ cache, defaultOptions, ...rest });
  return inject(APOLLO_INSTANCE_FACTORY)(id, client, defaultOptions);
}

export function apolloInstanceFactory(): ApolloInstanceFactory {
  return (_clientId: string, client: ApolloClient<any>, defaultOptions?: DefaultOptions): Apollo => new Apollo(client, defaultOptions);
}
