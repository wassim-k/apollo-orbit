import { MutationManager } from '@apollo-orbit/core';
import React from 'react';
import { StateManager } from './stateManager';

export interface ApolloOrbitContextValue {
  root: boolean;
  stateManager: StateManager;
  mutationManager: MutationManager;
}

export const ApolloOrbitContext = React.createContext<ApolloOrbitContextValue>({
  root: true,
  get stateManager(): StateManager {
    throw new Error('Please use <ApolloOrbitProvider states={states}>');
  },
  get mutationManager(): MutationManager {
    throw new Error('Please use <ApolloOrbitProvider states={states}>');
  }
});
