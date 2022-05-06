import { ApolloClient } from '@apollo/client/core';
import { Apollo } from './apollo';
import { DefaultOptions } from './types';

export type ApolloInstanceFactory = (clientId: string, client: ApolloClient<any>, defaultOptions?: DefaultOptions) => Apollo;
