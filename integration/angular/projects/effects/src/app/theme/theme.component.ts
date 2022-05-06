import { Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { ThemeName } from '../graphql';
import { ThemeQuery } from '../states/theme/gql/theme';
import { ToggleThemeAction } from '../states/theme/theme.actions';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss']
})
export class ThemeComponent {
  public readonly themeName = ThemeName;
  public readonly themeQuery = this.apollo.watchQuery({ ...new ThemeQuery(), notifyOnLoading: false });

  public constructor(
    private readonly apollo: Apollo
  ) { }

  public toggleTheme(): void {
    this.apollo.dispatch(new ToggleThemeAction());
  }
}
