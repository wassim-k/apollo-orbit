import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Apollo } from '@apollo-orbit/angular';
import { BooksQuery } from './gql/book';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksComponent {
  public isAddingBook = false;
  public isAddingAuthor = false;
  public readonly booksQuery = this.apollo.watchQuery({ ...new BooksQuery(), notifyOnNetworkStatusChange: true });

  public constructor(
    private readonly apollo: Apollo
  ) { }

  public refetch(): void {
    void this.booksQuery.refetch();
  }

  public addBook(): void {
    this.isAddingBook = true;
  }

  public cancelAddBook(): void {
    this.isAddingBook = false;
  }

  public addAuthor(): void {
    this.isAddingAuthor = true;
  }

  public cancelAddAuthor(): void {
    this.isAddingAuthor = false;
  }
}
