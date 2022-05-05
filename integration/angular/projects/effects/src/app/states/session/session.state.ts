import { Injectable } from '@angular/core';
import { ApolloCache, Effect, MutationUpdate, Resolve, ResolverContext, ResolverInfo, State } from '@apollo-orbit/angular';
import gql from 'graphql-tag';
import { Mutation, MutationToggleThemeArgs, Query, Theme } from '../../graphql/types';
import { Toastify } from '../../services/toastify.service';
import { SessionQuery, SessionQueryData, ToggleThemeMutation, ToggleThemeMutationInfo } from './gql/session';

@Injectable()
@State({
  typeDefs: gql`
    type Session {
      theme: Theme!
      toggles: Int!
    }

    enum Theme {
      DARK_THEME
      LIGHT_THEME
    }

    extend type Query {
      session: Session!
    }

    extend type Mutation {
      toggleTheme(force: Theme): Theme!
    }`
})
export class SessionState {
  private readonly MAXIMUM_TOGGLES = 5;

  public constructor(
    private readonly toastify: Toastify
  ) { }

  @Resolve(['Query', 'session'])
  public sessionResolver(rootValue: any, args: any, context: ResolverContext, info?: ResolverInfo): Query['session'] {
    return {
      __typename: 'Session',
      toggles: 0,
      theme: Theme.DarkTheme
    };
  }

  @Resolve(['Mutation', 'toggleTheme'])
  public toggleThemeResolver(rootValue: any, { force }: MutationToggleThemeArgs, { cache }: ResolverContext, info?: ResolverInfo): Mutation['toggleTheme'] {
    const { session, ...result } = cache.readQuery(new SessionQuery()) as SessionQueryData;

    if (session.toggles >= this.MAXIMUM_TOGGLES) {
      throw new Error('Maximum toggles reached.');
    } else {
      cache.writeQuery({ ...new SessionQuery(), data: { ...result, session: { ...session, toggles: session.toggles + 1 } } });
    }

    return force ?? (session.theme === Theme.LightTheme ? Theme.DarkTheme : Theme.LightTheme);
  }

  @MutationUpdate(ToggleThemeMutation)
  public toggleTheme(cache: ApolloCache<any>, { data }: ToggleThemeMutationInfo): void {
    if (!data) return;
    cache.updateQuery(new SessionQuery(), query => query ? { session: { ...query.session, theme: data.toggleTheme } } : query);
  }

  @Effect(ToggleThemeMutation)
  public toggleThemeEffect(result: ToggleThemeMutationInfo): void {
    if (result.data) {
      this.toastify.success(`Theme was toggled to ${result.data.toggleTheme}`);
    } else if (result.error) {
      this.toastify.error(`Failed to toggle theme: ${result.error.message}`);
    }
  }
}
