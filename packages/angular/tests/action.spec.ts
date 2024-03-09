import { Injectable } from '@angular/core';
import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Action, ActionContext, Apollo, APOLLO_OPTIONS, ApolloOrbitModule, InMemoryCache, ofActionComplete, ofActionDispatched, ofActionError, ofActionSuccess, State } from '@apollo-orbit/angular';
import { forkJoin, noop, Observable, throwError, timer } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import shortid from 'shortid';
import { Author, Book, BookFragment, BookInput, BooksQuery } from './graphql';

const author1Id = shortid.generate();
const author2Id = shortid.generate();

class AddBook {
  public static readonly type = '[Test] AddBook';

  public constructor(
    public readonly book: BookInput
  ) { }
}

class AddBookSuccess {
  public static readonly type = '[Test] AddBookSuccess';
}

class AddBookObservable {
  public static readonly type = '[Test] AddBookObservable';

  public constructor(
    public readonly book: BookInput
  ) { }
}

class AddBookPromise {
  public static readonly type = '[Test] AddBookPromise';

  public constructor(
    public readonly book: BookInput
  ) { }
}

@Injectable()
@State({
  typePolicies: {
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
  }
})
class TestState {
  @Action(AddBook)
  public addBook(action: AddBook, { cache, dispatch }: ActionContext): void {
    if (action.book.name === 'Error') throw new Error();
    const book = this.createNewBook(action.book);
    cache.updateQuery(new BooksQuery(), data => data ? { books: [...data.books, book] } : data);
    dispatch(new AddBookSuccess());
  }

  @Action(AddBookSuccess)
  public addBookSuccess(action: AddBookSuccess, context: ActionContext): void {
    // noop
  }

  @Action(AddBookObservable)
  public addBookObservable(action: AddBookObservable, { cache }: ActionContext): Observable<any> {
    if (action.book.name === 'Error') return throwError(() => new Error());
    return timer(10).pipe(
      map(() => this.createNewBook(action.book)),
      tap(book => cache.updateQuery(new BooksQuery(), data => data ? { books: [...data.books, book] } : data))
    );
  }

  @Action(AddBookPromise)
  public addBookPromise(action: AddBookPromise, { cache }: ActionContext): Promise<any> {
    return new Promise((resolve, reject) => setTimeout(() => {
      if (action.book.name === 'Error') reject(new Error());
      const book = this.createNewBook(action.book);
      cache.updateQuery(new BooksQuery(), data => data ? { books: [...data.books, book] } : data);
      resolve(void 0);
    }, 10));
  }

  private createNewBook(book: BookInput): BookFragment {
    return { __typename: 'Book' as const, id: shortid.generate(), ...book, genre: null };
  }
}

describe('Action', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloOrbitModule.forRoot([TestState])],
      providers: [
        { provide: APOLLO_OPTIONS, useFactory: () => ({ cache: new InMemoryCache() }) }
      ]
    });
  });

  describe('update', () => {
    it('should call update method and update cache (single success)', waitForAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const newBook: BookInput = { name: 'New Book', authorId: author1Id };

      apollo.dispatch(new AddBookObservable(newBook))
        .pipe(
          mergeMap(() => apollo.query(new BooksQuery()))
        ).subscribe(({ data }) => {
          expect(data?.books.some(b => b.name === newBook.name)).toBe(true);
        });
    }));

    it('should call update method and update cache (single error)', fakeAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const errorFn = jest.fn();

      apollo.dispatch(new AddBookObservable({ name: 'Error', authorId: author1Id }))
        .subscribe({ error: errorFn });

      tick(10);

      expect(errorFn).toHaveBeenCalled();

      tick(100); // auto-clean
    }));

    it('should call update method and update cache (multiple success)', waitForAsync(() => {
      const apollo = TestBed.inject(Apollo);

      const newBook1 = { name: 'New Book 1', authorId: author1Id };
      const newBook2 = { name: 'New Book 2', authorId: author1Id };
      const newBook3 = { name: 'New Book 2', authorId: author2Id };

      forkJoin([
        apollo.dispatch(new AddBook(newBook1)),
        apollo.dispatch(new AddBookPromise(newBook2)),
        apollo.dispatch(new AddBookObservable(newBook3))
      ]).pipe(
        mergeMap(() => apollo.query(new BooksQuery()))
      ).subscribe(({ data }) => {
        expect([newBook1, newBook2, newBook3].every(newBook => data?.books.some(b => b.name === newBook.name))).toBe(true);
      });
    }));

    it('should call update method and update cache (multiple error)', fakeAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const errorFn = jest.fn();

      const newBook1 = { name: 'Error', authorId: author1Id };
      const newBook2 = { name: 'Error', authorId: author1Id };
      const newBook3 = { name: 'Error', authorId: author2Id };

      forkJoin([
        apollo.dispatch(new AddBook(newBook1)),
        apollo.dispatch(new AddBookPromise(newBook2)),
        apollo.dispatch(new AddBookObservable(newBook3))
      ]).subscribe({ error: errorFn });

      tick(10);

      expect(errorFn).toHaveBeenCalledTimes(1);

      tick(100); // auto-clean
    }));
  });

  describe('ofAction', () => {
    it('ofActionDispatched', fakeAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const dispatchedFn = jest.fn();

      const newBook1 = { name: 'New Book 1', authorId: author1Id };
      const newBook2 = { name: 'New Book 2', authorId: author1Id };
      const newBook3 = { name: 'New Book 2', authorId: author2Id };

      apollo.actions.pipe(
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

      apollo.dispatch(new AddBook(newBook1));
      apollo.dispatch(new AddBookPromise(newBook2));
      apollo.dispatch(new AddBookObservable(newBook3));

      tick(10);

      expect(dispatchedFn).toHaveBeenCalledTimes(3);

      tick(100); // auto-clean
    }));

    it('ofActionSuccess', fakeAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const successFn = jest.fn();

      const newBook1 = { name: 'New Book 1', authorId: author1Id };
      const newBook2 = { name: 'New Book 2', authorId: author1Id };
      const newBook3 = { name: 'New Book 2', authorId: author2Id };

      apollo.actions.pipe(
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

      apollo.dispatch(new AddBook(newBook1));
      apollo.dispatch(new AddBookPromise(newBook2));
      apollo.dispatch(new AddBookObservable(newBook3));

      tick(10);

      expect(successFn).toHaveBeenCalledTimes(3);

      tick(100); // auto-clean
    }));

    it('ofActionError', fakeAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const errorFn = jest.fn();

      const newBook1 = { name: 'Error', authorId: author1Id };
      const newBook2 = { name: 'Error', authorId: author1Id };
      const newBook3 = { name: 'Error', authorId: author2Id };

      apollo.actions.pipe(
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

      apollo.dispatch(new AddBook(newBook1)).subscribe({ error: noop });
      apollo.dispatch(new AddBookPromise(newBook2)).subscribe({ error: noop });
      apollo.dispatch(new AddBookObservable(newBook3)).subscribe({ error: noop });

      tick(10);

      expect(errorFn).toHaveBeenCalledTimes(3);

      tick(100); // auto-clean
    }));

    it('ofActionComplete', fakeAsync(() => {
      const apollo = TestBed.inject(Apollo);
      const completeFn = jest.fn();

      apollo.actions.pipe(
        ofActionComplete(AddBook, AddBookSuccess, AddBookPromise, AddBookObservable)
      ).subscribe(result => {
        completeFn(result);
      });

      apollo.dispatch(new AddBook({ name: 'Error', authorId: author1Id })).subscribe({ error: noop });
      apollo.dispatch(new AddBookPromise({ name: 'Error', authorId: author1Id })).subscribe({ error: noop });
      apollo.dispatch(new AddBookObservable({ name: 'Error', authorId: author1Id })).subscribe({ error: noop });
      apollo.dispatch(new AddBook({ name: 'New Book 1', authorId: author1Id })).subscribe({ error: noop });
      apollo.dispatch(new AddBookPromise({ name: 'New Book 2', authorId: author1Id })).subscribe({ error: noop });
      apollo.dispatch(new AddBookObservable({ name: 'New Book 3', authorId: author1Id })).subscribe({ error: noop });

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

      tick(100); // auto-clean
    }));
  });
});
