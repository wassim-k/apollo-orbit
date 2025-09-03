import { state } from '@apollo-orbit/react';
import { gql } from '@apollo/client';
import Toastify from 'toastify-js';
import { THEME_QUERY, ThemeName } from '../../graphql';
import { ThemeToggledAction, ToggleThemeAction } from './theme.actions';

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
    }
  `)

  .typePolicies({
    Theme: {
      fields: {
        displayName: (_existing, { readField }) => readField<ThemeName>('name') === ThemeName.LightTheme ? 'Light' : 'Dark'
      }
    }
  })

  .onInit(cache => cache.writeQuery({
    query: THEME_QUERY,
    data: {
      theme: {
        __typename: 'Theme',
        name: ThemeName.LightTheme,
        toggles: 0,
        displayName: 'Light'
      }
    }
  }))

  .action<ToggleThemeAction>(
    'theme/toggle',
    (action, { cache, dispatch }) => {
      const result = cache.updateQuery({ query: THEME_QUERY }, data => data
        ? {
          theme: {
            ...data.theme,
            toggles: data.theme.toggles + 1,
            name: action.force ?? data.theme.name === ThemeName.DarkTheme ? ThemeName.LightTheme : ThemeName.DarkTheme
          }
        }
        : data);

      return dispatch<ThemeToggledAction>({ type: 'theme/toggled', toggles: result?.theme.toggles as number, theme: result?.theme.name as ThemeName });
    })

  .action<ThemeToggledAction>(
    'theme/toggled',
    action => {
      document.documentElement.className = '';
      if (action.theme === ThemeName.DarkTheme) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.add('light-mode');
      }

      Toastify({
        text: `Theme was toggled ${action.toggles} time(s)`,
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #00b09b, #96c93d)'
        }
      }).showToast();
    })
);
