import { ThemeName } from '../../graphql';

export class ToggleThemeAction {
    public static readonly type = '[Theme] ToggleTheme';

    public constructor(
        public readonly force?: ThemeName
    ) { }
}

export class ToggleThemeSuccessAction {
    public static readonly type = '[Theme] ToggleThemeSuccess';

    public constructor(
        public readonly toggles: number
    ) { }
}
