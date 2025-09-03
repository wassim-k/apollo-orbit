import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { gqlLazyQuery } from '../graphql';

@Component({
  selector: 'app-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe]
})
export class LazyComponent {
  private readonly apollo = inject(Apollo);

  protected readonly lazyQuery = this.apollo.watchQuery(gqlLazyQuery());
}
