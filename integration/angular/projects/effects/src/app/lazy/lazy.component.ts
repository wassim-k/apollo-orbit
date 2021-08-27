import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { LazyQuery } from './states/lazy/gql/lazy';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LazyComponent {
  public lazy$ = this.apollo.watchQuery(new LazyQuery());

  public constructor(
    private readonly apollo: Apollo
  ) { }
}
