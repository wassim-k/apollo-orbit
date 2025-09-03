import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Apollo } from '@apollo-orbit/angular';
import { gqlThemeQuery } from './graphql';
import { LibraryComponent } from './library/library.component';
import { ThemeComponent } from './theme/theme.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ThemeComponent, LibraryComponent, RouterLink, RouterLinkActive, RouterOutlet]
})
export class AppComponent {
  private readonly apollo = inject(Apollo);

  protected readonly themeQuery = this.apollo.signal.cacheQuery(gqlThemeQuery());
  protected readonly themeName = computed(() => this.themeQuery.data().theme.name.toLowerCase());
}
