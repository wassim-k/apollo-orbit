import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';
import { BooksQuery } from '../graphql';

@UntilDestroy()
@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksComponent implements OnInit {
  public readonly nameControl = new FormControl<string | null>(null);
  public readonly booksQuery = this.apollo.watchQuery({ ...new BooksQuery(), notifyOnNetworkStatusChange: true });
  public isAddingBook = false;
  public isAddingAuthor = false;

  public constructor(
    private readonly apollo: Apollo
  ) { }

  public ngOnInit(): void {
    this.nameControl.valueChanges.pipe(
      debounceTime(500),
      untilDestroyed(this)
    ).subscribe(name => this.booksQuery.refetch({ name: name !== null && name.length > 0 ? name : undefined }));
  }

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
