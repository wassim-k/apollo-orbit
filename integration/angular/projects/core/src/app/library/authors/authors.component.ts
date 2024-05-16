import { Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular/core';
import { AuthorsQuery } from '../../graphql';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-authors',
    templateUrl: './authors.component.html',
    styleUrls: ['./authors.component.scss'],
    standalone: true,
    imports: [AsyncPipe]
})
export class AuthorsComponent {
  public readonly authorsQuery = this.apollo.watchQuery({ ...new AuthorsQuery(), notifyOnNetworkStatusChange: true });

  public constructor(
    private readonly apollo: Apollo
  ) { }

  public refetch(): void {
    this.authorsQuery.refetch();
  }
}
