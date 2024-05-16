import { InjectionToken, inject } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApolloOrbit, state, withApolloOptions, withStates } from '@apollo-orbit/angular';
import shortid from 'shortid';
import { AddBookMutation, BookInput, BooksQuery } from './graphql';

const authorId = shortid.generate();
const MOCK_TOKEN = new InjectionToken('mock');

const testState = () => {
  const mock = inject<jest.Mock>(MOCK_TOKEN);

  return state(descriptor => descriptor
    .refetchQueries(AddBookMutation, result => {
      mock();
      return [new BooksQuery()];
    })
  );
};

describe('RefetchQueries', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApolloOrbit(
          withApolloOptions({ cache: new InMemoryCache() }),
          withStates(testState)
        ),
        { provide: MOCK_TOKEN, useValue: jest.fn() }
      ]
    });
  });

  it('should call refetch method', fakeAsync(() => {
    const apollo = TestBed.inject(Apollo);
    const mock = TestBed.inject(MOCK_TOKEN);
    const book: BookInput = { name: 'New Book', authorId };
    apollo.mutate({ ...new AddBookMutation({ book }) }).subscribe();
    tick();
    expect(mock).toHaveBeenCalled();

    tick(100); // auto-clean
  }));
});
