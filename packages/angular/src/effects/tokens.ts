import { InjectionToken } from '@angular/core';
import { Type } from '@apollo-orbit/core';

export const ROOT_STATES = new InjectionToken<Array<Type<any>>>('[apollo-orbit] root states');
export const CHILD_STATES = new InjectionToken<Array<Array<Type<any>>>>('[apollo-orbit] child states');
