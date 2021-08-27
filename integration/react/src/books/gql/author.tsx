/* eslint-disable */
import * as _ from '../../graphql/types';

import { TypedDocumentNode as DocumentNode } from '@apollo/client';
export type AuthorFragment = { __typename: 'Author', id: string, name: string, age: _.Maybe<number> };

export type AuthorsQueryVariables = _.Exact<{ [key: string]: never; }>;


export type AuthorsQuery = { __typename?: 'Query', authors: Array<{ __typename: 'Author', id: string, name: string, age: _.Maybe<number> }> };

export type AddAuthorMutationVariables = _.Exact<{
  author: _.AuthorInput;
}>;


export type AddAuthorMutation = { __typename?: 'Mutation', addAuthor: _.Maybe<{ __typename: 'Author', id: string, name: string, age: _.Maybe<number> }> };

export type NewAuthorSubscriptionVariables = _.Exact<{ [key: string]: never; }>;


export type NewAuthorSubscription = { __typename?: 'Subscription', newAuthor: { __typename: 'Author', id: string, name: string, age: _.Maybe<number> } };

export const AuthorFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthorFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Author"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"age"}}]}}]} as unknown as DocumentNode<AuthorFragment, unknown>;
export const AuthorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthorFragment"}}]}}]}},...AuthorFragmentDoc.definitions]} as unknown as DocumentNode<AuthorsQuery, AuthorsQueryVariables>;
export const AddAuthorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAuthor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"author"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AuthorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAuthor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"author"},"value":{"kind":"Variable","name":{"kind":"Name","value":"author"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthorFragment"}}]}}]}},...AuthorFragmentDoc.definitions]} as unknown as DocumentNode<AddAuthorMutation, AddAuthorMutationVariables>;
export const NewAuthorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NewAuthor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newAuthor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthorFragment"}}]}}]}},...AuthorFragmentDoc.definitions]} as unknown as DocumentNode<NewAuthorSubscription, NewAuthorSubscriptionVariables>;