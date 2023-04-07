import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { BooksQuery } from '../../graphql';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksComponent {
  public readonly booksQuery = this.apollo.watchQuery({ ...new BooksQuery(), notifyOnNetworkStatusChange: true });

  public constructor(
    private readonly apollo: Apollo
  ) { }

  public refetch(): void {
    this.booksQuery.refetch();
  }
}
