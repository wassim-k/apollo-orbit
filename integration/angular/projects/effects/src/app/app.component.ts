import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { map } from 'rxjs/operators';
import { SessionQuery } from './states/session/gql/session';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  public readonly theme$ = this.apollo.watchQuery({ ...new SessionQuery(), emitInitial: false }).pipe(
    map(result => result.data?.session.theme.toLowerCase())
  );

  public constructor(
    private readonly apollo: Apollo
  ) { }
}
