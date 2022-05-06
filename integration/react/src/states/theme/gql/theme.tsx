/* eslint-disable */
import * as _ from '../../../graphql/types';

import { TypedDocumentNode as DocumentNode } from '@apollo/client';
export type ThemeQueryVariables = _.Exact<{ [key: string]: never; }>;


export type ThemeQuery = { __typename?: 'Query', theme: { __typename?: 'Theme', name: _.ThemeName, toggles: number, displayName: string } };


export const ThemeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Theme"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"theme"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"toggles"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]} as unknown as DocumentNode<ThemeQuery, ThemeQueryVariables>;