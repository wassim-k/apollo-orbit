import { Component, signal } from '@angular/core';
import { AuthorsComponent } from './authors/authors.component';
import { BooksComponent } from './books/books.component';
import { NewAuthorComponent } from './new-author/new-author.component';
import { NewBookComponent } from './new-book/new-book.component';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
  imports: [BooksComponent, NewBookComponent, NewAuthorComponent, AuthorsComponent]
})
export class LibraryComponent {
  protected isAddingBook = signal(false);
  protected isAddingAuthor = signal(false);

  protected addBook(): void {
    this.isAddingBook.set(true);
  }

  protected cancelAddBook(): void {
    this.isAddingBook.set(false);
  }

  protected addAuthor(): void {
    this.isAddingAuthor.set(true);
  }

  protected cancelAddAuthor(): void {
    this.isAddingAuthor.set(false);
  }
}
