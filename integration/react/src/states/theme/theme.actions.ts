import { ThemeName } from '../../graphql';

export interface ToggleThemeAction {
  type: 'theme/toggle';
  force?: ThemeName;
}

export interface ThemeToggledAction {
  type: 'theme/toggled';
  toggles: number;
}
