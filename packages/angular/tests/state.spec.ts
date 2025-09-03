import { AsyncPipe } from '@angular/common';
import { Component, inject, NgModule } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter, RouterModule } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Apollo, InMemoryCache, provideApollo, provideApolloInstance, withApolloOptions, ɵApolloRegistry } from '@apollo-orbit/angular';
import { ApolloActions, provideStates, state, withState } from '@apollo-orbit/angular/state';
import { ApolloLink } from '@apollo/client';
import { LocalState } from '@apollo/client/local-state';
import { from, timer } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { ADD_BOOK_CLIENT_MUTATION, AddBookInput, gqlAddBookClientMutation, gqlAuthorClientQuery, gqlAuthorsClientQuery, gqlBooksClientQuery, MutationAddBookArgs, Query } from './graphql';

const author1Id = uuid();
const author2Id = uuid();

class AddBook {
  public static readonly type = '[Test] AddBook';

  public constructor(
    public readonly book: AddBookInput
  ) { }
}

@Component({
  template: `
    @if (booksQuery | async; as result) { <div id="test">{{ result.data.books.length }}</div> }
  `,
  imports: [AsyncPipe]
})
class TestComponent {
  private readonly apollo = inject(Apollo);

  public readonly booksQuery = this.apollo.query(gqlBooksClientQuery());
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
      ...gqlBooksClientQuery(),
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
      map(() => ({ __typename: 'Book', id: uuid(), ...book, genre: null }))
    );
  })
  .mutationUpdate(ADD_BOOK_CLIENT_MUTATION, (cache, info) => {
    if (info.data) {
      const { addBook } = info.data;
      cache.updateQuery(gqlBooksClientQuery(), data => data ? { books: [...data.books, addBook] } : data);
    }
  })
  .action(AddBook, (action, { cache }) => {
    return timer(10).pipe(
      map(() => ({ __typename: 'Book' as const, id: uuid(), ...action.book, genre: null })),
      tap(book => cache.updateQuery(gqlBooksClientQuery(), data => data ? { books: [...data.books, book] } : data))
    );
  })
);

describe('State', () => {
  describe('rootState', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestComponent],
        providers: [
          provideApollo(
            withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty(), localState: new LocalState() }),
            withState(testState)
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
        apollo.query(gqlAuthorsClientQuery()).subscribe(result => {
          expect(result.data?.authors).toHaveLength(2);
        });
      }));

      it('should call type policies read function', waitForAsync(() => {
        const apollo = TestBed.inject(Apollo);
        apollo.query(gqlAuthorsClientQuery()).pipe(
          mergeMap(() => apollo.query(gqlAuthorClientQuery({ id: author1Id })))
        ).subscribe(result => {
          expect(result.data?.author.id).toEqual(author1Id);
        });
      }));
    });

    describe('update', () => {
      it('should call update method and update cache', waitForAsync(() => {
        const apollo = TestBed.inject(Apollo);
        const book: AddBookInput = { name: 'New Book', authorId: author1Id };
        apollo.mutate(gqlAddBookClientMutation({ book })).pipe(
          mergeMap(() => apollo.query(gqlBooksClientQuery()))
        ).subscribe(({ data }) => {
          expect(data?.books.find(b => b.name === book.name)).not.toBeUndefined();
        });
      }));
    });

    describe('dispatch', () => {
      it('should call action handler', waitForAsync(() => {
        const apollo = TestBed.inject(Apollo);
        const actions = TestBed.inject(ApolloActions);
        const book: AddBookInput = { name: 'New Book', authorId: author1Id };
        from(actions.dispatch(new AddBook(book))).pipe(
          mergeMap(() => apollo.query(gqlBooksClientQuery()))
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
          provideApollo(withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty(), localState: new LocalState() }), withState(rootState)),
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

      const actions = TestBed.inject(ApolloActions);
      actions.dispatch(new AddBook({ name: 'New Book', authorId: author1Id }));

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
          provideApollo(
            withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty(), localState: new LocalState() }),
            withState(rootState)
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

      const actions = TestBed.inject(ApolloActions);
      actions.dispatch(new AddBook({ name: 'New Book', authorId: author1Id }));

      expect(rootFn).toHaveBeenCalledTimes(1);
      expect(child1Fn).toHaveBeenCalledTimes(1);
      expect(child2Fn).toHaveBeenCalledTimes(1);
    });

    it('should dispatch actions to lazy loaded apollo instances', async () => {
      class ApolloCustom extends Apollo { }

      TestBed.configureTestingModule({
        providers: [
          provideApollo(
            withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty(), localState: new LocalState() }),
            withState()
          ),
          provideRouter([
            {
              path: 'child1',
              children: []
            },
            {
              path: 'child2',
              loadChildren: () => [
                {
                  path: '',
                  providers: [
                    provideApolloInstance(ApolloCustom, { id: 'custom', cache: new InMemoryCache(), link: ApolloLink.empty(), localState: new LocalState() })
                  ],
                  children: []
                }
              ]
            }
          ])
        ]
      });

      const harness = await RouterTestingHarness.create('/child1');
      {
        const registry = TestBed.inject(ɵApolloRegistry);
        expect(registry.instances).toHaveLength(1);
      }

      await harness.navigateByUrl('/child2');
      {
        const registry = TestBed.inject(ɵApolloRegistry);
        expect(registry.instances).toHaveLength(2);
      }
    });
  });
});
