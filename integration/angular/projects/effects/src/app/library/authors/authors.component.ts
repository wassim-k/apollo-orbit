import { Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { AuthorsQuery } from '../../graphql';

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.scss']
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
