import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ApolloOrbitModule } from '@apollo-orbit/angular';
import { AuthorsComponent } from './authors/authors.component';
import { BooksComponent } from './books/books.component';
import { LibraryComponent } from './library.component';
import { NewAuthorComponent } from './new-author/new-author.component';
import { NewBookComponent } from './new-book/new-book.component';
import { AuthorState } from './states/author.state';
import { BookState } from './states/book.state';

@NgModule({
  declarations: [
    AuthorsComponent,
    BooksComponent,
    LibraryComponent,
    NewAuthorComponent,
    NewBookComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ApolloOrbitModule.forChild([AuthorState, BookState])
  ],
  exports: [
    LibraryComponent
  ]
})
export class LibraryModule { }
