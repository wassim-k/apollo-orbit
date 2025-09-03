import { InjectionToken } from '@angular/core';
import { ApolloClient } from '@apollo/client';
import { Apollo } from '../apollo';
import { DefaultOptions } from '../types';

export type ApolloInstanceFactory = (clientId: string, client: ApolloClient, defaultOptions?: DefaultOptions) => Apollo;

export const APOLLO_INSTANCE_FACTORY = new InjectionToken<ApolloInstanceFactory>('[apollo-orbit] apollo instance factory');
