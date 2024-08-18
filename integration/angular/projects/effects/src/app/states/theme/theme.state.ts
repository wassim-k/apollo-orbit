import { inject } from '@angular/core';
import { gql, state } from '@apollo-orbit/angular';
import { ThemeName, ThemeQuery } from '../../graphql';
import { Toastify } from '../../services/toastify.service';
import { ThemeToggledAction, ToggleThemeAction } from './theme.actions';

export const themeState = () => {
  const toastify = inject(Toastify);

  return state(descriptor => descriptor
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
    .onInit(cache => {
      cache.writeQuery({
        ...new ThemeQuery(),
        data: {
          theme: {
            __typename: 'Theme',
            name: ThemeName.LightTheme,
            toggles: 0,
            displayName: 'Light'
          }
        }
      });
    })
    .action(ToggleThemeAction, (action, { cache, dispatch }) => {
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
    })
    .action(ThemeToggledAction, (action, context) => {
      toastify.success(`Theme was toggled ${action.toggles} time(s)`);
    })
  );
};
