import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloActions, ofActionComplete, ofActionDispatched, ofActionError, ofActionSuccess, state, withState } from '@apollo-orbit/angular/state';
import { ApolloLink } from '@apollo/client/link';
import { forkJoin, from, noop, throwError, timer } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { AddBookInput, Author, Book, BookFragment, gqlBooksQuery } from './graphql';

const author1Id = uuid();
const author2Id = uuid();

class AddBook {
  public static readonly type = '[Test] AddBook';

  public constructor(
    public readonly book: AddBookInput
  ) { }
}

class AddBookSuccess {
  public static readonly type = '[Test] AddBookSuccess';
}

class AddBookObservable {
  public static readonly type = '[Test] AddBookObservable';

  public constructor(
    public readonly book: AddBookInput
  ) { }
}

class AddBookPromise {
  public static readonly type = '[Test] AddBookPromise';

  public constructor(
    public readonly book: AddBookInput
  ) { }
}

const testState = () => state(descriptor => descriptor
  .typePolicies({
    Query: {
      fields: {
        authors: existing => existing ?? [
          { __typename: 'Author', id: author1Id, name: 'Author 1' },
          { __typename: 'Author', id: author2Id, name: 'Author 2' }
        ] as Array<Author>,
        books: existing => existing ?? [
          { __typename: 'Book', id: '1', name: 'Book 1', genre: 'Fiction', authorId: author1Id },
          { __typename: 'Book', id: '2', name: 'Book 2', genre: 'History', authorId: author1Id },
          { __typename: 'Book', id: '3', name: 'Book 3', genre: 'Science', authorId: author1Id },
          { __typename: 'Book', id: '4', name: 'Book 4', genre: 'Biography', authorId: author2Id }
        ] as Array<Book>
      }
    }
  })
  .action(AddBook, (action, { cache, dispatch }) => {
    if (action.book.name === 'Error') throw new Error();
    const book = createNewBook(action.book);
    cache.updateQuery(gqlBooksQuery(), data => data ? { books: [...data.books, book] } : data);
    dispatch(new AddBookSuccess());
  })
  .action(AddBookSuccess, (action, context) => {
    // noop
  })
  .action(AddBookObservable, (action, { cache }) => {
    if (action.book.name === 'Error') return throwError(() => new Error());
    return timer(10).pipe(
      map(() => createNewBook(action.book)),
      tap(book => cache.updateQuery(gqlBooksQuery(), data => data ? { books: [...data.books, book] } : data))
    );
  })
  .action(AddBookPromise, (action, { cache }) => {
    return new Promise((resolve, reject) => setTimeout(() => {
      if (action.book.name === 'Error') reject(new Error());
      const book = createNewBook(action.book);
      cache.updateQuery(gqlBooksQuery(), data => data ? { books: [...data.books, book] } : data);
      resolve(void 0);
    }, 10));
  })
);

function createNewBook(book: AddBookInput): BookFragment {
  return { __typename: 'Book' as const, id: uuid(), ...book, genre: null };
}

describe('Action', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApollo(
          withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty() }),
          withState(testState)
        )
      ]
    });
  });

  describe('update', () => {
    it('should call update method and update cache (single success)', waitForAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const actions = TestBed.inject(ApolloActions);
      const newBook: AddBookInput = { name: 'New Book', authorId: author1Id };

      from(actions.dispatch(new AddBookObservable(newBook))).pipe(
        mergeMap(() => apollo.query(gqlBooksQuery()))
      ).subscribe(({ data }) => {
        expect(data?.books.some(b => b.name === newBook.name)).toBe(true);
      });
    }));

    it('should call update method and update cache (single error)', async () => {
      const actions = TestBed.inject(ApolloActions);
      const errorFn = jest.fn();

      await actions.dispatch(new AddBookObservable({ name: 'Error', authorId: author1Id }))
        .catch(errorFn);

      expect(errorFn).toHaveBeenCalled();
    });

    it('should call update method and update cache (multiple success)', waitForAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const actions = TestBed.inject(ApolloActions);

      const newBook1 = { name: 'New Book 1', authorId: author1Id };
      const newBook2 = { name: 'New Book 2', authorId: author1Id };
      const newBook3 = { name: 'New Book 2', authorId: author2Id };

      forkJoin([
        actions.dispatch(new AddBook(newBook1)),
        actions.dispatch(new AddBookPromise(newBook2)),
        actions.dispatch(new AddBookObservable(newBook3))
      ]).pipe(
        mergeMap(() => apollo.query(gqlBooksQuery()))
      ).subscribe(({ data }) => {
        expect([newBook1, newBook2, newBook3].every(newBook => data?.books.some(b => b.name === newBook.name))).toBe(true);
      });
    }));

    it('should call update method and update cache (multiple error)', fakeAsync(() => {
      const actions = TestBed.inject(ApolloActions);
      const errorFn = jest.fn();

      const newBook1 = { name: 'Error', authorId: author1Id };
      const newBook2 = { name: 'Error', authorId: author1Id };
      const newBook3 = { name: 'Error', authorId: author2Id };

      forkJoin([
        actions.dispatch(new AddBook(newBook1)),
        actions.dispatch(new AddBookPromise(newBook2)),
        actions.dispatch(new AddBookObservable(newBook3))
      ]).subscribe({ error: errorFn });

      tick(10);

      expect(errorFn).toHaveBeenCalledTimes(1);
    }));
  });

  describe('ofAction', () => {
    it('ofActionDispatched', fakeAsync(() => {
      const actions = TestBed.inject(ApolloActions);

      const dispatchedFn = jest.fn();

      const newBook1 = { name: 'New Book 1', authorId: author1Id };
      const newBook2 = { name: 'New Book 2', authorId: author1Id };
      const newBook3 = { name: 'New Book 2', authorId: author2Id };

      actions.pipe(
        ofActionDispatched(AddBook, AddBookPromise, AddBookObservable)
      ).subscribe(action => {
        if (action instanceof AddBook) {
          dispatchedFn(action);
        } else if (action instanceof AddBookPromise) {
          dispatchedFn(action);
        } else if (action instanceof AddBookObservable) {
          dispatchedFn(action);
        }
      });

      actions.dispatch(new AddBook(newBook1));
      actions.dispatch(new AddBookPromise(newBook2));
      actions.dispatch(new AddBookObservable(newBook3));

      tick(10);

      expect(dispatchedFn).toHaveBeenCalledTimes(3);
    }));

    it('ofActionSuccess', fakeAsync(() => {
      const actions = TestBed.inject(ApolloActions);
      const successFn = jest.fn();

      const newBook1 = { name: 'New Book 1', authorId: author1Id };
      const newBook2 = { name: 'New Book 2', authorId: author1Id };
      const newBook3 = { name: 'New Book 2', authorId: author2Id };

      actions.pipe(
        ofActionSuccess(AddBook, AddBookPromise, AddBookObservable)
      ).subscribe(action => {
        if (action instanceof AddBook) {
          successFn(action);
        } else if (action instanceof AddBookPromise) {
          successFn(action);
        } else if (action instanceof AddBookObservable) {
          successFn(action);
        }
      });

      actions.dispatch(new AddBook(newBook1));
      actions.dispatch(new AddBookPromise(newBook2));
      actions.dispatch(new AddBookObservable(newBook3));

      tick(10);

      expect(successFn).toHaveBeenCalledTimes(3);
    }));

    it('ofActionError', fakeAsync(() => {
      const actions = TestBed.inject(ApolloActions);
      const errorFn = jest.fn();

      const newBook1 = { name: 'Error', authorId: author1Id };
      const newBook2 = { name: 'Error', authorId: author1Id };
      const newBook3 = { name: 'Error', authorId: author2Id };

      actions.pipe(
        ofActionError(AddBook, AddBookPromise, AddBookObservable)
      ).subscribe(action => {
        if (action instanceof AddBook) {
          errorFn(action);
        } else if (action instanceof AddBookPromise) {
          errorFn(action);
        } else if (action instanceof AddBookObservable) {
          errorFn(action);
        }
      });

      actions.dispatch(new AddBook(newBook1)).catch(noop);
      actions.dispatch(new AddBookPromise(newBook2)).catch(noop);
      actions.dispatch(new AddBookObservable(newBook3)).catch(noop);

      tick(10);

      expect(errorFn).toHaveBeenCalledTimes(3);
    }));

    it('ofActionComplete', fakeAsync(() => {
      const actions = TestBed.inject(ApolloActions);
      const completeFn = jest.fn();

      actions.pipe(
        ofActionComplete(AddBook, AddBookSuccess, AddBookPromise, AddBookObservable)
      ).subscribe(result => {
        completeFn(result);
      });

      actions.dispatch(new AddBook({ name: 'Error', authorId: author1Id })).catch(noop);
      actions.dispatch(new AddBookPromise({ name: 'Error', authorId: author1Id })).catch(noop);
      actions.dispatch(new AddBookObservable({ name: 'Error', authorId: author1Id })).catch(noop);
      actions.dispatch(new AddBook({ name: 'New Book 1', authorId: author1Id })).catch(noop);
      actions.dispatch(new AddBookPromise({ name: 'New Book 2', authorId: author1Id })).catch(noop);
      actions.dispatch(new AddBookObservable({ name: 'New Book 3', authorId: author1Id })).catch(noop);

      tick(10);

      expect(completeFn).toHaveBeenCalledTimes(7);

      expect(completeFn).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: 'error' }));
      expect(completeFn.mock.calls[0][0].action).toBeInstanceOf(AddBook);

      expect(completeFn).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 'success' }));
      expect(completeFn.mock.calls[1][0].action).toBeInstanceOf(AddBookSuccess);

      expect(completeFn).toHaveBeenNthCalledWith(3, expect.objectContaining({ status: 'success' }));
      expect(completeFn.mock.calls[2][0].action).toBeInstanceOf(AddBook);

      expect(completeFn).toHaveBeenNthCalledWith(4, expect.objectContaining({ status: 'error' }));
      expect(completeFn.mock.calls[3][0].action).toBeInstanceOf(AddBookObservable);

      expect(completeFn).toHaveBeenNthCalledWith(5, expect.objectContaining({ status: 'error' }));
      expect(completeFn.mock.calls[4][0].action).toBeInstanceOf(AddBookPromise);

      expect(completeFn).toHaveBeenNthCalledWith(6, expect.objectContaining({ status: 'success' }));
      expect(completeFn.mock.calls[5][0].action).toBeInstanceOf(AddBookPromise);

      expect(completeFn).toHaveBeenNthCalledWith(7, expect.objectContaining({ status: 'success' }));
      expect(completeFn.mock.calls[6][0].action).toBeInstanceOf(AddBookObservable);
    }));
  });
});
