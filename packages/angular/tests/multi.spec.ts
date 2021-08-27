import { Component, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Apollo, ApolloOptions, ApolloOrbitModule, InMemoryCache, MutationUpdate, Resolve, ResolverContext, apolloFactory, modifyQuery } from '@apollo-orbit/angular';
import { ApolloCache } from '@apollo/client/core';
import { take } from 'rxjs/operators';
import shortid from 'shortid';
import { AddAuthorMutation, AddAuthorMutationInfo, AddBookMutation, AddBookMutationInfo, AuthorInput, AuthorsQuery, BookInput, BooksQuery, Mutation, MutationAddAuthorArgs, MutationAddBookArgs } from './graphql';

const authorId = shortid.generate();

const sharedCache = new InMemoryCache();
sharedCache.writeQuery({ ...new BooksQuery(), data: { books: [] } });
sharedCache.writeQuery({ ...new AuthorsQuery(), data: { authors: [] } });

/******************************
 *            Book            *
 ******************************/
const APOLLO_BOOK_OPTIONS = new InjectionToken<ApolloOptions>('Apollo Book');
class ApolloBook extends Apollo { }

@State({
  clientId: 'book'
})
class BookState {
  @Resolve(['Mutation', 'addBook'])
  public addBookResolver(rootValue: any, { book }: MutationAddBookArgs, context: ResolverContext): Mutation['addBook'] {
    return {
      __typename: 'Book',
      id: shortid.generate(),
      name: book.name,
      authorId: book.authorId,
      genre: book.genre ?? null
    };
  }

  @MutationUpdate(AddBookMutation)
  public addBook(cache: ApolloCache<any>, result: AddBookMutationInfo): void {
    if (result.data) {
      const { addBook } = result.data;
      modifyQuery(cache, new BooksQuery(), query => query ? { books: [...query.books, addBook] } : query);
    }
  }
}

/******************************
 *            Author            *
 ******************************/
const APOLLO_AUTHOR_OPTIONS = new InjectionToken<ApolloOptions>('Apollo Author');
class ApolloAuthor extends Apollo { }

@State({
  clientId: 'author'
})
class AuthorState {
  @Resolve(['Mutation', 'addAuthor'])
  public addAuthorResolver(rootValue: any, { author }: MutationAddAuthorArgs, context: ResolverContext): Mutation['addAuthor'] {
    return {
      __typename: 'Author',
      id: authorId,
      books: [],
      ...author
    };
  }

  @MutationUpdate(AddAuthorMutation)
  public addAuthor(cache: ApolloCache<any>, result: AddAuthorMutationInfo): void {
    if (result.data) {
      const { addAuthor } = result.data;
      modifyQuery(cache, new AuthorsQuery(), query => query ? { authors: [...query.authors, addAuthor] } : query);
    }
  }
}

@Component({
  template: `
    <div id="books" *ngIf="booksQuery | async as booksResult">{{ booksResult.data.books[0].name }}</div>
    <div id="authors" *ngIf="authorsQuery | async as authorsResult">{{ authorsResult.data.authors[0].name }}</div>
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
  beforeEach(() => TestBed.resetTestingModule());

  it('should render component with result', async () => {
    TestBed.configureTestingModule({
      imports: [ApolloOrbitModule.forRoot([BookState, AuthorState])],
      declarations: [TestComponent],
      providers: [
        { provide: APOLLO_BOOK_OPTIONS, useValue: { id: 'book', cache: sharedCache } },
        { provide: ApolloBook, useFactory: apolloFactory, deps: [APOLLO_BOOK_OPTIONS] },
        { provide: APOLLO_AUTHOR_OPTIONS, useValue: { id: 'author', cache: sharedCache } },
        { provide: ApolloAuthor, useFactory: apolloFactory, deps: [APOLLO_AUTHOR_OPTIONS] }
      ]
    });
    const fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.addAuthor({ name: 'New Author' });
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.authorsQuery.pipe(take(1)).subscribe(author => {
      if (author.data) {
        fixture.componentInstance.addBook({ name: 'New Book', authorId: author.data.authors[0].id });
      }
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#authors').textContent).toEqual('New Author');
    expect(fixture.nativeElement.querySelector('#books').textContent).toEqual('New Book');
  });

  it('should throw error with duplicate default clients', async () => {
    TestBed.configureTestingModule({
      imports: [ApolloOrbitModule.forRoot()],
      providers: [
        { provide: APOLLO_BOOK_OPTIONS, useValue: { cache: sharedCache } },
        { provide: ApolloBook, useFactory: apolloFactory, deps: [APOLLO_BOOK_OPTIONS] },
        { provide: APOLLO_AUTHOR_OPTIONS, useValue: { cache: sharedCache } },
        { provide: ApolloAuthor, useFactory: apolloFactory, deps: [APOLLO_AUTHOR_OPTIONS] }
      ]
    });
    expect(() => {
      TestBed.inject(ApolloBook);
      TestBed.inject(ApolloAuthor);
    }).toThrowError('Apollo clients with duplicate options.id: \'default\'');
  });

  it('should throw error with duplicate named clients', async () => {
    TestBed.configureTestingModule({
      imports: [ApolloOrbitModule.forRoot()],
      providers: [
        { provide: APOLLO_BOOK_OPTIONS, useValue: { id: 'duplicate', cache: sharedCache } },
        { provide: ApolloBook, useFactory: apolloFactory, deps: [APOLLO_BOOK_OPTIONS] },
        { provide: APOLLO_AUTHOR_OPTIONS, useValue: { id: 'duplicate', cache: sharedCache } },
        { provide: ApolloAuthor, useFactory: apolloFactory, deps: [APOLLO_AUTHOR_OPTIONS] }
      ]
    });
    expect(() => {
      TestBed.inject(ApolloBook);
      TestBed.inject(ApolloAuthor);
    }).toThrowError('Apollo clients with duplicate options.id: \'duplicate\'');
  });
});
