import { Component, computed, inject } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { ApolloActions } from '@apollo-orbit/angular/state';
import { gqlThemeQuery } from '../graphql';
import { ToggleThemeAction } from '../states/theme/theme.actions';

@Component({
  selector: 'app-theme',
  template: `
    <span>Current theme:</span>
    <span>{{ theme().displayName }}</span>
    <button type="button" (click)="toggleTheme()">Toggle theme</button>
  `,
  styles: `
    * {
      margin-right: 0.5em;
    }
  `
})
export class ThemeComponent {
  private readonly apollo = inject(Apollo);
  private readonly actions = inject(ApolloActions);

  protected readonly themeQuery = this.apollo.signal.cacheQuery(gqlThemeQuery());
  protected readonly theme = computed(() => this.themeQuery.data().theme);

  protected toggleTheme(): void {
    this.actions.dispatch(new ToggleThemeAction());
  }
}
