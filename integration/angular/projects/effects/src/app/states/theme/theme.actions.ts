import { ThemeName } from '../../graphql';

export class ToggleThemeAction {
  public static readonly type = '[Theme] ToggleTheme';

  public constructor(
    public readonly force?: ThemeName
  ) { }
}

export class ThemeToggledAction {
  public static readonly type = '[Theme] ThemeToggled';

  public constructor(
    public readonly toggles: number
  ) { }
}
