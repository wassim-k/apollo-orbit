import { MutationManager } from '@apollo-orbit/core';
import { ApolloClient } from '@apollo/client/core';

export interface ManagerFactory {
  createManager(clientId: string, client: ApolloClient<any>): MutationManager;
}
