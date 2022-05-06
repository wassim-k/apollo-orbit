import { InjectionToken } from '@angular/core';
import { ApolloInstanceFactory } from './instanceFactory';
import { ApolloOptions } from './types';

export const APOLLO_OPTIONS = new InjectionToken<ApolloOptions>('[apollo-orbit] options');
export const APOLLO_OPTIONS_INTERNAL = new InjectionToken<ApolloOptions>('[apollo-orbit] options internal');
export const APOLLO_MULTI_ROOT = new InjectionToken<boolean>('[apollo-orbit] multi root');
export const APOLLO_INSTANCE_FACTORY = new InjectionToken<ApolloInstanceFactory>('[apollo-orbit] apollo instance factory');
