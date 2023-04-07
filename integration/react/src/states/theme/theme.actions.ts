import { ThemeName } from '../../graphql';

export interface ToggleThemeAction {
    type: 'TOGGLE_THEME';
    force?: ThemeName;
}

export interface ToggleThemeSuccessAction {
    type: 'TOGGLE_THEME_SUCCESS';
    toggles: number;
}
