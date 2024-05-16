import { Component, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApolloInstance, provideApolloOrbit, state, withStates } from '@apollo-orbit/angular';
import { take } from 'rxjs/operators';
import shortid from 'shortid';
import { AddAuthorMutation, AddBookMutation, AuthorInput, AuthorsQuery, BookInput, BooksQuery, Mutation, MutationAddAuthorArgs, MutationAddBookArgs } from './graphql';

const authorId = shortid.generate();

const sharedCache = new InMemoryCache();
sharedCache.writeQuery({ ...new BooksQuery(), data: { books: [] } });
sharedCache.writeQuery({ ...new AuthorsQuery(), data: { authors: [] } });

/******************************
 *            Book            *
 ******************************/
class ApolloBook extends Apollo { }

const bookState = () => state(descriptor => descriptor
  .clientId('book')
  .resolver(['Mutation', 'addBook'], (rootValue, { book }: MutationAddBookArgs, context, info): Mutation['addBook'] => {
    return {
      __typename: 'Book',
      id: shortid.generate(),
      name: book.name,
      authorId: book.authorId,
      genre: book.genre ?? null
    };
  })
  .mutationUpdate(AddBookMutation, (cache, info) => {
    if (info.data) {
      const { addBook } = info.data;
      cache.updateQuery(new BooksQuery(), data => data ? { books: [...data.books, addBook] } : data);
    }
  })
);

/******************************
 *            Author            *
 ******************************/
class ApolloAuthor extends Apollo { }

const authorState = () => state(descriptor => descriptor
  .clientId('author')
  .resolver(['Mutation', 'addAuthor'], (rootValue, { author }: MutationAddAuthorArgs, context): Mutation['addAuthor'] => {
    return {
      __typename: 'Author',
      id: authorId,
      books: [],
      ...author
    };
  })
  .mutationUpdate(AddAuthorMutation, (cache, info) => {
    if (info.data) {
      const { addAuthor } = info.data;
      cache.updateQuery(new AuthorsQuery(), data => data ? { authors: [...data.authors, addAuthor] } : data);
    }
  })
);

@Component({
  template: `
    <div id="books" *ngIf="booksQuery | async as booksResult">{{ booksResult.data.books[0]?.name }}</div>
    <div id="authors" *ngIf="authorsQuery | async as authorsResult">{{ authorsResult.data.authors[0]?.name }}</div>
  `
})
class TestComponent {
  public readonly booksQuery = this.apolloBook.watchQuery(new BooksQuery());
  public readonly authorsQuery = this.apolloAuthor.watchQuery(new AuthorsQuery());

  public constructor(
    private readonly apolloBook: ApolloBook,
    private readonly apolloAuthor: ApolloAuthor
  ) { }

  public addBook(book: BookInput): void {
    this.apolloBook.mutate(new AddBookMutation({ book })).subscribe();
  }

  public addAuthor(author: AuthorInput): void {
    this.apolloAuthor.mutate(new AddAuthorMutation({ author })).subscribe();
  }
}

describe('Multi', () => {
  it('should throw if options was not passed', () => {
    TestBed.configureTestingModule({
      providers: [
        provideApolloOrbit()
      ]
    });

    expect(() => TestBed.inject(Apollo)).toThrow(/must be passed/);
  });

  it('should render component with result', async () => {
    TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [
        provideApolloOrbit(withStates(bookState, authorState)),
        provideApolloInstance(ApolloBook, { id: 'book', cache: sharedCache }),
        provideApolloInstance(ApolloAuthor, { id: 'author', cache: sharedCache })
      ]
    });
    const fixture = TestBed.createComponent(TestComponent);
    fixture.autoDetectChanges();
    // why is wrapping the following in zone required after ng13 upgrade?
    TestBed.inject(NgZone).run(() => {
      fixture.componentInstance.addAuthor({ name: 'New Author' });
      fixture.componentInstance.authorsQuery.pipe(take(2)).subscribe(author => {
        if (author.data && author.data.authors.length > 0) {
          fixture.componentInstance.addBook({ name: 'New Book', authorId: author.data.authors[0].id });
        }
      });
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#authors').textContent).toEqual('New Author');
    expect(fixture.nativeElement.querySelector('#books').textContent).toEqual('New Book');
  });

  it('should throw error with duplicate default clients', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideApolloOrbit(),
        provideApolloInstance(ApolloBook, { cache: sharedCache }),
        provideApolloInstance(ApolloAuthor, { cache: sharedCache })
      ]
    });
    expect(() => {
      TestBed.inject(ApolloBook);
      TestBed.inject(ApolloAuthor);
    }).toThrow('Apollo clients with duplicate options.id: \'default\'');
  });

  it('should throw error with duplicate named clients', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideApolloOrbit(),
        provideApolloInstance(ApolloBook, { id: 'duplicate', cache: sharedCache }),
        provideApolloInstance(ApolloAuthor, { id: 'duplicate', cache: sharedCache })
      ]
    });
    expect(() => {
      TestBed.inject(ApolloBook);
      TestBed.inject(ApolloAuthor);
    }).toThrow('Apollo clients with duplicate options.id: \'duplicate\'');
  });
});
