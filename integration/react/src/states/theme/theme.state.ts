import { state } from '@apollo-orbit/react';
import gql from 'graphql-tag';
import { Theme, ThemeDocument, ThemeName } from '../../graphql';
import { ToggleThemeAction, ToggleThemeSuccessAction } from './theme.actions';

const Toastify = require('toastify-js'); // eslint-disable-line @typescript-eslint/no-var-requires

export const themeState = state(descriptor => descriptor
  .typeDefs(gql`
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
    }`)

  .typePolicies({
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
  })

  .action<ToggleThemeAction>(
    'TOGGLE_THEME',
    (action, { cache, dispatch }) => {
      const result = cache.updateQuery({ query: ThemeDocument }, data => data
        ? {
          theme: {
            ...data.theme,
            toggles: data.theme.toggles + 1,
            name: action.force ?? data.theme.name === ThemeName.DarkTheme ? ThemeName.LightTheme : ThemeName.DarkTheme
          }
        }
        : data);

      return dispatch<ToggleThemeSuccessAction>({ type: 'TOGGLE_THEME_SUCCESS', toggles: result?.theme.toggles as number });
    })

  .action<ToggleThemeSuccessAction>(
    'TOGGLE_THEME_SUCCESS',
    action => {
      Toastify({
        text: `Theme was toggled ${action.toggles} times(s)`,
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #00b09b, #96c93d)'
        }
      }).showToast();
    })
);
