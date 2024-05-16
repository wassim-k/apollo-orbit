import { InjectionToken } from '@angular/core';
import { ApolloInstanceFactory } from './instanceFactory';

export const APOLLO_PROVIDED = new InjectionToken('[apollo-orbit] apollo provided');
export const APOLLO_MULTI_ROOT = new InjectionToken<boolean>('[apollo-orbit] multi root');
export const APOLLO_INSTANCE_FACTORY = new InjectionToken<ApolloInstanceFactory>('[apollo-orbit] apollo instance factory');
