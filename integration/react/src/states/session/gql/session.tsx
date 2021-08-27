/* eslint-disable */
import * as _ from '../../../graphql/types';

import { TypedDocumentNode as DocumentNode } from '@apollo/client';
export type SessionQueryVariables = _.Exact<{ [key: string]: never; }>;


export type SessionQuery = { __typename?: 'Query', session: { __typename?: 'Session', currentUserToken: number, refreshes: number } };

export type RefreshUserTokenMutationVariables = _.Exact<{ [key: string]: never; }>;


export type RefreshUserTokenMutation = { __typename?: 'Mutation', refreshUserToken: number };


export const SessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUserToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshes"}}]}}]}}]} as unknown as DocumentNode<SessionQuery, SessionQueryVariables>;
export const RefreshUserTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshUserToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshUserToken"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"}}]}]}}]} as unknown as DocumentNode<RefreshUserTokenMutation, RefreshUserTokenMutationVariables>;