import { Component, NgModule } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterModule, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Apollo, InMemoryCache, provideApolloOrbit, provideStates, state, withApolloOptions, withStates } from '@apollo-orbit/angular';
import { timer } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import shortid from 'shortid';
import { AddBookMutation, AuthorQuery, AuthorsQuery, BookInput, BooksQuery, MutationAddBookArgs, Query } from './graphql';

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

const testState = () => state(descriptor => descriptor
  .typePolicies({
    Query: {
      fields: {
        author: {
          read: (existing: Query['author'] | undefined, { toReference, args }) => {
            return existing ?? toReference({ __typename: 'Author', id: args?.id });
          }
        }
      }
    }
  })
  .onInit(cache => {
    cache.writeQuery({
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
  })
  .resolver(['Query', 'authors'], (rootValue, args, context, info) => {
    return Promise.resolve()
      .then(() => [
        { __typename: 'Author', id: author1Id, name: 'Author 1', books: [] },
        { __typename: 'Author', id: author2Id, name: 'Author 2', books: [] }
      ]);
  })
  .resolver(['Mutation', 'addBook'], (rootValue, { book }: MutationAddBookArgs, context, info) => {
    return timer(10).pipe(
      map(() => ({ __typename: 'Book', id: shortid.generate(), ...book, genre: null }))
    );
  })
  .mutationUpdate(AddBookMutation, (cache, info) => {
    if (info.data) {
      const { addBook } = info.data;
      cache.updateQuery(new BooksQuery(), data => data ? { books: [...data.books, addBook] } : data);
    }
  })
  .action(AddBook, (action, { cache }) => {
    return timer(10).pipe(
      map(() => ({ __typename: 'Book' as const, id: shortid.generate(), ...action.book, genre: null })),
      tap(book => cache.updateQuery(new BooksQuery(), data => data ? { books: [...data.books, book] } : data))
    );
  })
);

describe('State', () => {
  describe('rootState', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        declarations: [TestComponent],
        providers: [
          provideApolloOrbit(
            withApolloOptions({ cache: new InMemoryCache() }),
            withStates(testState)
          )
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

    describe('dispatch', () => {
      it('should call action handler', waitForAsync(() => {
        const apollo = TestBed.inject(Apollo);
        const book: BookInput = { name: 'New Book', authorId: author1Id };
        apollo.dispatch(new AddBook(book)).pipe(
          mergeMap(() => apollo.query(new BooksQuery()))
        ).subscribe(({ data }) => {
          expect(data?.books.find(b => b.name === book.name)).not.toBeUndefined();
        });
      }));
    });
  });

  describe('childState', () => {
    let rootFn: jest.Mock;
    let child1Fn: jest.Mock;
    let child2Fn: jest.Mock;

    const rootState = () => state(descriptor => descriptor
      .action(AddBook, (action, _ctx) => rootFn())
    );

    const child1State = () => state(descriptor => descriptor
      .action(AddBook, (action, _ctx) => child1Fn())
    );

    const child2State = () => state(descriptor => descriptor
      .action(AddBook, (action, _ctx) => child2Fn())
    );

    beforeEach(() => {
      rootFn = jest.fn();
      child1Fn = jest.fn();
      child2Fn = jest.fn();
    });

    it('should provide child states using provideStates (standalone)', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideApolloOrbit(withApolloOptions({ cache: new InMemoryCache() }), withStates(rootState)),
          provideRouter([
            {
              path: 'child1',
              providers: [provideStates(child1State)],
              children: []
            },
            {
              path: 'child2',
              providers: [provideStates(child2State)],
              children: []
            }
          ])
        ]
      });

      const harness = await RouterTestingHarness.create('child1');
      await harness.navigateByUrl('/child2');

      const apollo = TestBed.inject(Apollo);
      apollo.dispatch(new AddBook({ name: 'New Book', authorId: author1Id }));

      expect(rootFn).toHaveBeenCalledTimes(1);
      expect(child1Fn).toHaveBeenCalledTimes(1);
      expect(child2Fn).toHaveBeenCalledTimes(1);
    });

    it('should provide child states using provideStates (module)', async () => {
      @NgModule({
        imports: [
          RouterModule.forChild([{
            path: '',
            children: []
          }])
        ],
        providers: [provideStates(child1State)]
      })
      class Child1Module { }

      @NgModule({
        imports: [
          RouterModule.forChild([{
            path: '',
            children: []
          }])
        ],
        providers: [provideStates(child2State)]
      })
      class Child2Module { }

      TestBed.configureTestingModule({
        providers: [
          provideApolloOrbit(
            withApolloOptions({ cache: new InMemoryCache() }),
            withStates(rootState)
          ),
          provideRouter([
            {
              path: 'child1',
              loadChildren: () => Child1Module
            },
            {
              path: 'child2',
              loadChildren: () => Child2Module
            }
          ])
        ]
      });

      const harness = await RouterTestingHarness.create('child1');
      await harness.navigateByUrl('/child2');

      const apollo = TestBed.inject(Apollo);
      apollo.dispatch(new AddBook({ name: 'New Book', authorId: author1Id }));

      expect(rootFn).toHaveBeenCalledTimes(1);
      expect(child1Fn).toHaveBeenCalledTimes(1);
      expect(child2Fn).toHaveBeenCalledTimes(1);
    });
  });
});
