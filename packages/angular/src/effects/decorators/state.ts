import { DocumentNode, PossibleTypesMap, TypePolicies } from '@apollo/client/core';
import { updateStateDefinition } from './internal';

export interface StateOptions {
  /**
   * Client identifier in a multi-client setup
   */
  clientId?: string;
  typeDefs?: string | Array<string> | DocumentNode | Array<DocumentNode>;
  typePolicies?: TypePolicies;
  possibleTypes?: PossibleTypesMap;
}

export function State(options?: StateOptions) {
  return (target: any): void => {
    updateStateDefinition(
      target,
      descriptor => {
        if (options?.clientId !== undefined) {
          descriptor.clientId(options.clientId);
        }
        if (options?.possibleTypes !== undefined) {
          descriptor.possibleTypes(options.possibleTypes);
        }
        if (options?.typeDefs !== undefined) {
          descriptor.typeDefs(options.typeDefs);
        }
        if (options?.typePolicies !== undefined) {
          descriptor.typePolicies(options.typePolicies);
        }
        if (target.prototype.onInit !== undefined) {
          descriptor.onInit(target.prototype.onInit);
        }
      });
    return target;
  };
}
