import { Component } from '@angular/core';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
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
