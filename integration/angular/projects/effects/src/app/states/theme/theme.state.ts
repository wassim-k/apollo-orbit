import { Injectable } from '@angular/core';
import { Action, ActionContext, State } from '@apollo-orbit/angular';
import gql from 'graphql-tag';
import { Theme, ThemeName, ThemeQuery } from '../../graphql';
import { Toastify } from '../../services/toastify.service';
import { ThemeToggledAction, ToggleThemeAction } from './theme.actions';

@Injectable()
@State({
  typeDefs: gql`
  type Theme {
    name: ThemeName!
    displayName: String!
    toggles: Int!
  }

  enum ThemeName {
    DARK_THEME
    LIGHT_THEME
  }

  extend type Query {
    theme: Theme!
  }`,
  typePolicies: {
    Query: {
      fields: {
        theme: (existing: Theme | undefined, options): Theme => existing ?? {
          __typename: 'Theme',
          name: ThemeName.LightTheme,
          toggles: 0,
          displayName: 'Light'
        }
      }
    },
    Theme: {
      fields: {
        displayName: (existing, { readField }) => readField<ThemeName>('name') === ThemeName.LightTheme ? 'Light' : 'Dark'
      }
    }
  }
})
export class ThemeState {
  public constructor(
    private readonly toastify: Toastify
  ) { }

  @Action(ToggleThemeAction)
  public toggleTheme(action: ToggleThemeAction, { cache, dispatch }: ActionContext) {
    const result = cache.updateQuery(new ThemeQuery(), data => data
      ? {
        theme: {
          ...data.theme,
          toggles: data.theme.toggles + 1,
          name: action.force ?? data.theme.name === ThemeName.DarkTheme ? ThemeName.LightTheme : ThemeName.DarkTheme
        }
      }
      : data);

    return dispatch(new ThemeToggledAction(result?.theme.toggles as number));
  }

  @Action(ThemeToggledAction)
  public themeToggled(action: ThemeToggledAction, context: ActionContext) {
    this.toastify.success(`Theme was toggled ${action.toggles} time(s)`);
  }
}
