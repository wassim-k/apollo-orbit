import { Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { ToggleThemeMutation } from '../states/session/api/session';

@Component({
  selector: 'app-theme-toggler',
  templateUrl: './theme-toggler.component.html',
  styleUrls: ['./theme-toggler.component.scss']
})
export class ThemeTogglerComponent {
  public constructor(
    private readonly apollo: Apollo
  ) { }

  public toggleTheme(): void {
    this.apollo.mutate(new ToggleThemeMutation()).subscribe();
  }
}
