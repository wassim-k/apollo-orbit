import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { map } from 'rxjs/operators';
import { ThemeQuery } from './states/theme/gql/theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  public readonly theme$ = this.apollo.watchQuery({ ...new ThemeQuery(), notifyOnLoading: false }).pipe(
    map(result => result.data?.theme.name.toLowerCase())
  );

  public constructor(
    private readonly apollo: Apollo
  ) { }
}
