import { InjectionToken } from '@angular/core';
import { ApolloClient } from '@apollo/client';
import { Apollo } from '../apollo';

export type ApolloInstanceFactory = (clientId: string, client: ApolloClient) => Apollo;

export const APOLLO_INSTANCE_FACTORY = new InjectionToken<ApolloInstanceFactory>('[apollo-orbit] apollo instance factory');
