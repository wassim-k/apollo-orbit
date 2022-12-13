import { Component, Injectable } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Action, ActionContext, Apollo, ApolloCache, ApolloOptions, ApolloOrbitModule, APOLLO_OPTIONS, InMemoryCache, MutationUpdate, Resolve, ResolverContext, ResolverInfo, State } from '@apollo-orbit/angular';
import { Observable, timer } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import shortid from 'shortid';
import { AddBookMutation, AddBookMutationInfo, AuthorQuery, AuthorsQuery, BookInput, BooksQuery, Mutation, MutationAddBookArgs, Query } from './graphql';

const author1Id = shortid.generate();
const author2Id = shortid.generate();

class AddBook {
  public static readonly type = '[Test] AddBook';

  public constructor(
    public readonly book: BookInput
  ) { }
}

@Component({
  template: `
    <div id="test" *ngIf="booksQuery | async as result">{{ result.data.books.length }}</div>
  `
})
class TestComponent {
  public readonly booksQuery = this.apollo.query(new BooksQuery());

  public constructor(
    private readonly apollo: Apollo
  ) { }
}

@Injectable()
@State({
  typePolicies: {
    Query: {
      fields: {
        author: {
          read: (existing: Query['author'] | undefined, { toReference, args }) => {
            return existing ?? toReference({ __typename: 'Author', id: args?.id });
          }
        }
      }
    }
  }
})
class TestState {
  public constructor(apollo: Apollo) {
    apollo.cache.writeQuery({
      ...new BooksQuery(),
      data: {
        books: [
          { __typename: 'Book', id: '1', name: 'Book 1', genre: 'Fiction', authorId: author1Id },
          { __typename: 'Book', id: '2', name: 'Book 2', genre: 'History', authorId: author1Id },
          { __typename: 'Book', id: '3', name: 'Book 3', genre: 'Science', authorId: author1Id },
          { __typename: 'Book', id: '4', name: 'Book 4', genre: 'Biography', authorId: author2Id }
        ]
      }
    });
  }

  @Resolve(['Query', 'authors'])
  public authorsResolver(rootValue: any, args: any, context: ResolverContext, info?: ResolverInfo): Promise<Query['authors']> {
    return Promise.resolve()
      .then(() => [
        { __typename: 'Author', id: author1Id, name: 'Author 1', books: [] },
        { __typename: 'Author', id: author2Id, name: 'Author 2', books: [] }
      ]);
  }

  @Resolve(['Mutation', 'addBook'])
  public addBookResolver(rootValue: any, { book }: MutationAddBookArgs, context: ResolverContext, info?: ResolverInfo): Observable<Mutation['addBook']> {
    return timer(10).pipe(
      map(() => ({ __typename: 'Book', id: shortid.generate(), ...book, genre: null }))
    );
  }

  @MutationUpdate(AddBookMutation)
  public addBook(cache: ApolloCache<any>, result: AddBookMutationInfo): void {
    if (result.data) {
      const { addBook } = result.data;
      cache.updateQuery(new BooksQuery(), query => query ? { books: [...query.books, addBook] } : query);
    }
  }

  @Action(AddBook)
  public addBookAction(action: AddBook, { cache }: ActionContext): Observable<any> {
    return timer(10).pipe(
      map(() => ({ __typename: 'Book' as const, id: shortid.generate(), ...action.book, genre: null })),
      tap(book => cache.updateQuery(new BooksQuery(), query => query ? { books: [...query.books, book] } : query))
    );
  }
}

function apolloOptionsFactory(): ApolloOptions {
  return {
    cache: new InMemoryCache()
  };
}

describe('State', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloOrbitModule.forRoot([TestState])],
      declarations: [TestComponent],
      providers: [
        { provide: APOLLO_OPTIONS, useFactory: apolloOptionsFactory }
      ]
    });
  });

  describe('query', () => {
    it('should render component with result', async () => {
      const fixture = TestBed.createComponent(TestComponent);
      fixture.autoDetectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('#test').textContent).toEqual('4');
    });

    it('should run client resolvers', waitForAsync(() => {
      const apollo = TestBed.inject(Apollo);
      apollo.query(new AuthorsQuery()).subscribe(result => {
        expect(result.data?.authors).toHaveLength(2);
      });
    }));

    it('should call type policies read function', waitForAsync(() => {
      const apollo = TestBed.inject(Apollo);
      apollo.query(new AuthorsQuery()).pipe(
        mergeMap(() => apollo.query(new AuthorQuery({ id: author1Id })))
      ).subscribe(result => {
        expect(result.data?.author.id).toEqual(author1Id);
      });
    }));
  });

  describe('update', () => {
    it('should call update method and update cache', waitForAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const book: BookInput = { name: 'New Book', authorId: author1Id };
      apollo.mutate(new AddBookMutation({ book })).pipe(
        mergeMap(() => apollo.query(new BooksQuery()))
      ).subscribe(({ data }) => {
        expect(data?.books.find(b => b.name === book.name)).not.toBeUndefined();
      });
    }));
  });
});
