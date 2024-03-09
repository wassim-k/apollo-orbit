import { MutationManager } from '@apollo-orbit/core';
import React from 'react';
import { StateManager } from './stateManager';

export interface ApolloOrbitContextValue {
  stateManager: StateManager;
  mutationManager: MutationManager;
}

export const ApolloOrbitContext = React.createContext<ApolloOrbitContextValue>({
  stateManager: new StateManager(),
  get mutationManager(): MutationManager {
    throw new Error('Please use <ApolloOrbitProvider states={states}>');
  }
});
