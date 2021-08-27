import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BooksComponent } from './books.component';
import { NewAuthorComponent } from './new-author/new-author.component';
import { NewBookComponent } from './new-book/new-book.component';

@NgModule({
  declarations: [
    NewBookComponent,
    NewAuthorComponent,
    BooksComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    BooksComponent
  ]
})
export class BooksModule { }
