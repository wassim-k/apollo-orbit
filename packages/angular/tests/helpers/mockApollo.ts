import { Apollo } from '@apollo-orbit/angular';
import { MutationManager } from '@apollo-orbit/core';
import { ApolloClient, ApolloError, ApolloLink, InMemoryCache } from '@apollo/client/core';
import { MockedResponse, MockLink } from '@apollo/client/testing/core';

export function mockApollo(mockedResponses: ReadonlyArray<MockedResponse>, addTypename?: boolean): Apollo;
export function mockApollo(mockLink: ApolloLink): Apollo;
export function mockApollo(mockedResponsesOrLink: ReadonlyArray<MockedResponse> | ApolloLink, addTypename?: boolean): Apollo {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: mockedResponsesOrLink instanceof ApolloLink ? mockedResponsesOrLink : new MockLink(mockedResponsesOrLink, addTypename)
  });
  return new Apollo(client, new MutationManager(graphQLErrors => new ApolloError({ graphQLErrors })));
}
