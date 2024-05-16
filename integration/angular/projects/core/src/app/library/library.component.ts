import { Component } from '@angular/core';
import { NewAuthorComponent } from './new-author/new-author.component';
import { NewBookComponent } from './new-book/new-book.component';
import { AuthorsComponent } from './authors/authors.component';
import { BooksComponent } from './books/books.component';

@Component({
    selector: 'app-library',
    templateUrl: './library.component.html',
    styleUrls: ['./library.component.scss'],
    standalone: true,
    imports: [BooksComponent, AuthorsComponent, NewBookComponent, NewAuthorComponent]
})
export class LibraryComponent {
  public isAddingBook = false;
  public isAddingAuthor = false;

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
