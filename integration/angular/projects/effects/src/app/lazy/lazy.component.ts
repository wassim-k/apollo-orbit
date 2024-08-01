import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { LazyQuery } from '../graphql';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe]
})
export class LazyComponent {
  public lazyQuery = this.apollo.watchQuery(new LazyQuery());

  public constructor(
    private readonly apollo: Apollo
  ) { }
}
