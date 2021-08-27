import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ApolloOrbitModule } from '@apollo-orbit/angular';
import { BooksComponent } from './books.component';
import { NewAuthorComponent } from './new-author/new-author.component';
import { NewBookComponent } from './new-book/new-book.component';
import { AuthorState } from './states/author.state';
import { BookState } from './states/book.state';

@NgModule({
  declarations: [
    NewBookComponent,
    NewAuthorComponent,
    BooksComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ApolloOrbitModule.forChild([AuthorState, BookState])
  ],
  exports: [
    BooksComponent
  ]
})
export class BooksModule { }
