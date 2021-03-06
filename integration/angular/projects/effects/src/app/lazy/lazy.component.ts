import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { LazyQuery } from './states/lazy/api/lazy';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LazyComponent {
  public lazyQuery = this.apollo.watchQuery(new LazyQuery());

  public constructor(
    private readonly apollo: Apollo
  ) { }
}
