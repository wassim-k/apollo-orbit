import { state } from '@apollo-orbit/react';
import { gql } from '@apollo/client';
import { ThemeDocument, ThemeName } from '../../graphql';
import { ThemeToggledAction, ToggleThemeAction } from './theme.actions';

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
    }
  `)

  .typePolicies({
    Theme: {
      fields: {
        displayName: (existing, { readField }) => readField<ThemeName>('name') === ThemeName.LightTheme ? 'Light' : 'Dark'
      }
    }
  })

  .onInit(cache => cache.writeQuery({
    query: ThemeDocument,
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
      const result = cache.updateQuery({ query: ThemeDocument }, data => data
        ? {
          theme: {
            ...data.theme,
            toggles: data.theme.toggles + 1,
            name: action.force ?? data.theme.name === ThemeName.DarkTheme ? ThemeName.LightTheme : ThemeName.DarkTheme
          }
        }
        : data);

      return dispatch<ThemeToggledAction>({ type: 'theme/toggled', toggles: result?.theme.toggles as number });
    })

  .action<ThemeToggledAction>(
    'theme/toggled',
    action => {
      Toastify({
        text: `Theme was toggled ${action.toggles} time(s)`,
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #00b09b, #96c93d)'
        }
      }).showToast();
    })
);
