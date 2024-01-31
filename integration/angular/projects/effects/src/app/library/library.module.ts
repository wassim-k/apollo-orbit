import { CommonModule } from '@angular/common';
import { ComponentRef, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Apollo, ApolloOrbitModule } from '@apollo-orbit/angular';
import { ROOT_BOOTSTRAP_LISTENER } from '../config/bootstrap.module';
import { AuthorsQuery, NewAuthorSubscription } from '../graphql';
import { Toastify } from '../services/toastify.service';
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
  providers: [
    // This is necessary because of the use of APP_INITIALIZER in ConfigModule for initializing AppConfig
    // Injecting Apollo instance too early will attempt to retrieve config instance before APP_INITIALIZER has completed running and will trigger an error.
    // ROOT_BOOTSTRAP_LISTENER is called after AppComponent is bootstrapped which is guaranteed to run after APP_INITIALIZER has completed.
    {
      provide: ROOT_BOOTSTRAP_LISTENER,
      multi: true,
      useFactory: (apollo: Apollo, toastify: Toastify) => (_rootComponentRef: ComponentRef<any>) => {
        apollo.subscribe(new NewAuthorSubscription()).subscribe(result => {
          const newAuthorData = result.data;
          if (!newAuthorData) return;
          apollo.cache.updateQuery(new AuthorsQuery(), data => data ? { authors: [...data.authors, { ...newAuthorData.newAuthor, books: [] }] } : data);
          toastify.success(`New author '${newAuthorData.newAuthor.name}' was added.`);
        });
      },
      deps: [Apollo, Toastify]
    }
  ],
  exports: [
    LibraryComponent
  ]
})
export class LibraryModule { }
