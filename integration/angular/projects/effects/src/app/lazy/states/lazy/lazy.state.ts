import { Injectable } from '@angular/core';
import { Resolve, ResolverContext, ResolverInfo, State } from '@apollo-orbit/angular';
import gql from 'graphql-tag';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { Query } from '../../../graphql';

@State({
  typeDefs: gql`
    extend type Query {
        lazy: Boolean!
    }`
})
@Injectable()
export class LazyState {
  @Resolve(['Query', 'lazy'])
  public lazy(rootValue: any, args: any, context: ResolverContext, info?: ResolverInfo): Observable<Query['lazy']> {
    return timer(2000).pipe(map(() => true));
  }
}
