import { Inject, Injectable, InjectionToken } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { APOLLO_OPTIONS, Apollo, ApolloOrbitModule, InMemoryCache, RefetchQueries, RefetchQueryDescriptor, State } from '@apollo-orbit/angular';
import shortid from 'shortid';
import { AddBookMutation, AddBookMutationInfo, BookInput, BooksQuery } from './graphql';

const authorId = shortid.generate();
const MOCK_TOKEN = new InjectionToken('mock');

@Injectable()
@State()
class TestState {
  public constructor(
    @Inject(MOCK_TOKEN) private readonly mock: jest.Mock
  ) { }

  @RefetchQueries(AddBookMutation)
  public addBookRefetch(result: AddBookMutationInfo): RefetchQueryDescriptor {
    this.mock();
    return [new BooksQuery()];
  }
}

describe('RefetchQueries', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloOrbitModule.forRoot([TestState])],
      providers: [
        { provide: MOCK_TOKEN, useValue: jest.fn() },
        { provide: APOLLO_OPTIONS, useValue: { cache: new InMemoryCache() } }
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
