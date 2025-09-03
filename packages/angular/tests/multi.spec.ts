import { AsyncPipe } from '@angular/common';
import { Component, inject, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApollo, provideApolloInstance } from '@apollo-orbit/angular';
import { state, withState } from '@apollo-orbit/angular/state';
import { ApolloLink } from '@apollo/client/link';
import { MockLink } from '@apollo/client/testing';
import { take } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { ADD_AUTHOR_MUTATION, ADD_BOOK_MUTATION, AddBookInput, AuthorInput, gqlAddAuthorMutation, gqlAddBookMutation, gqlAuthorsQuery, gqlBooksQuery } from './graphql';

const authorId = uuid();

const sharedCache = new InMemoryCache();
sharedCache.writeQuery({ ...gqlBooksQuery(), data: { books: [] } });
sharedCache.writeQuery({ ...gqlAuthorsQuery(), data: { authors: [] } });

/******************************
 *            Book            *
 ******************************/
class ApolloBook extends Apollo { }

const bookState = () => state(descriptor => descriptor
  .clientId('book')
  .mutationUpdate(ADD_BOOK_MUTATION, (cache, info) => {
    if (info.data) {
      const { addBook } = info.data;
      cache.updateQuery(gqlBooksQuery(), data => data ? { books: [...data.books, addBook] } : data);
    }
  })
);

/******************************
 *            Author            *
 ******************************/
class ApolloAuthor extends Apollo { }

const authorState = () => state(descriptor => descriptor
  .clientId('author')
  .mutationUpdate(ADD_AUTHOR_MUTATION, (cache, info) => {
    if (info.data) {
      const { addAuthor } = info.data;
      cache.updateQuery(gqlAuthorsQuery(), data => data ? { authors: [...data.authors, addAuthor] } : data);
    }
  })
);

@Component({
  template: `
    @if (booksQuery | async; as booksResult) { <div id="books">{{ booksResult.data.books[0]?.name }}</div> }
    @if (authorsQuery | async; as authorsResult) { <div id="authors">{{ authorsResult.data.authors[0]?.name }}</div> }
  `,
  imports: [AsyncPipe]
})
class TestComponent {
  private readonly apolloBook = inject(ApolloBook);
  private readonly apolloAuthor = inject(ApolloAuthor);

  public readonly booksQuery = this.apolloBook.watchQuery(gqlBooksQuery());
  public readonly authorsQuery = this.apolloAuthor.watchQuery(gqlAuthorsQuery());

  public addBook(book: AddBookInput): void {
    this.apolloBook.mutate(gqlAddBookMutation({ book })).subscribe();
  }

  public addAuthor(author: AuthorInput): void {
    this.apolloAuthor.mutate(gqlAddAuthorMutation({ author })).subscribe();
  }
}

describe('Multi', () => {
  let link: ApolloLink;

  beforeEach(() => {
    MockLink.defaultOptions = { delay: 0 };

    link = new MockLink([
      {
        request: { query: ADD_BOOK_MUTATION, variables: variables => variables },
        result: variables => ({
          data: {
            addBook: { __typename: 'Book', id: uuid(), ...variables.book, genre: null }
          }
        })
      },
      {
        request: { query: ADD_AUTHOR_MUTATION, variables: variables => variables },
        result: variables => ({
          data: {
            addAuthor: { __typename: 'Author', id: authorId, books: [], ...variables.author }
          }
        })
      }
    ]);
  });

  it('should throw if options was not passed', () => {
    TestBed.configureTestingModule({
      providers: [
        provideApollo(withState())
      ]
    });

    expect(() => TestBed.inject(Apollo)).toThrow(/must be passed/);
  });

  it('should render component with result', async () => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        provideApollo(withState(bookState, authorState)),
        provideApolloInstance(ApolloBook, { id: 'book', cache: sharedCache, link }),
        provideApolloInstance(ApolloAuthor, { id: 'author', cache: sharedCache, link })
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
        provideApollo(withState()),
        provideApolloInstance(ApolloBook, { cache: sharedCache, link: ApolloLink.empty() }),
        provideApolloInstance(ApolloAuthor, { cache: sharedCache, link: ApolloLink.empty() })
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
        provideApollo(withState()),
        provideApolloInstance(ApolloBook, { id: 'duplicate', cache: sharedCache, link: ApolloLink.empty() }),
        provideApolloInstance(ApolloAuthor, { id: 'duplicate', cache: sharedCache, link: ApolloLink.empty() })
      ]
    });
    expect(() => {
      TestBed.inject(ApolloBook);
      TestBed.inject(ApolloAuthor);
    }).toThrow('Apollo clients with duplicate options.id: \'duplicate\'');
  });
});
