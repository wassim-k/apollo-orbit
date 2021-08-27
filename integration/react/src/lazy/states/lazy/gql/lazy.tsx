/* eslint-disable */
import * as _ from '../../../../graphql/types';

import { TypedDocumentNode as DocumentNode } from '@apollo/client';
export type LazyQueryVariables = _.Exact<{ [key: string]: never; }>;


export type LazyQuery = { __typename?: 'Query', lazy: string };


export const LazyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Lazy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lazy"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"}}]}]}}]} as unknown as DocumentNode<LazyQuery, LazyQueryVariables>;