import { NgModule } from '@angular/core';
import { ApolloOptions, ApolloOrbitModule, APOLLO_OPTIONS, InMemoryCache } from '@apollo-orbit/angular';
import { split } from '@apollo/client/core';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { getMainDefinition } from '@apollo/client/utilities';

@NgModule({
    imports: [ApolloOrbitModule.forRoot()],
    providers: [
        { provide: MockLink, useValue: new MockLink([]) },
        { provide: MockSubscriptionLink, useValue: new MockSubscriptionLink() },
        {
            provide: APOLLO_OPTIONS,
            useFactory: (link: MockLink, subscriptionLink: MockSubscriptionLink): ApolloOptions => ({
                cache: new InMemoryCache(),
                link: split(
                    ({ query }) => {
                        const definition = getMainDefinition(query);
                        return (
                            definition.kind === 'OperationDefinition' &&
                            definition.operation === 'subscription'
                        );
                    },
                    subscriptionLink,
                    link
                )
            }),
            deps: [MockLink, MockSubscriptionLink]
        }
    ]
})
export class ApolloMockModule { }
