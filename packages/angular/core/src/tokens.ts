import { InjectionToken } from '@angular/core';
import { ManagerFactory } from './managerFactory';
import { ApolloOptions } from './types';

export const APOLLO_OPTIONS = new InjectionToken<ApolloOptions>('[apollo-orbit] options');
export const APOLLO_OPTIONS_INTERNAL = new InjectionToken<ApolloOptions>('[apollo-orbit] options internal');
export const APOLLO_MULTI_ROOT = new InjectionToken<boolean>('[apollo-orbit] multi root');
export const MANAGER_FACTORY = new InjectionToken<ManagerFactory>('[apollo-orbit] manager factory');
