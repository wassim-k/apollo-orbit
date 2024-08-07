import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing/core';
import { GraphQLError } from 'graphql';
import { BookQuery, BookQueryData, NewBookByAuthorSubscription, NewBookByAuthorSubscriptionData } from './graphql';
import { ApolloMockModule } from './helpers';

@Component({
  template: `
    @if (bookQuery | async; as result) {
      @if (result.data) { <div id="query-result">{{ result.data.book.name }}</div> }
      @if (result.error) { <div id="query-error">{{ result.error.message }}</div> }
    }
    @if (newBookSubscription | async; as result) {
      @if (result.data) { <div id="subscription-result">{{ result.data.newBook.name }}</div> }
    }
  `
})
class BookComponent {
  public readonly bookQuery = this.apollo.watchQuery(new BookQuery({ id: '1' }));
  public readonly newBookSubscription = this.apollo.subscribe(new NewBookByAuthorSubscription({ id: '1' }));

  public constructor(
    private readonly apollo: Apollo
  ) { }
}

describe('Testing', () => {
  let mockLink: MockLink;
  let mockSubscriptionLink: MockSubscriptionLink;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BookComponent],
      imports: [ApolloMockModule]
    });

    mockLink = TestBed.inject(MockLink);
    mockSubscriptionLink = TestBed.inject(MockSubscriptionLink);
  });

  it('should render component with query result', async () => {
    mockLink.addMockedResponse({
      request: new BookQuery({ id: '1' }),
      result: {
        data: {
          book: { __typename: 'Book', id: '1', name: 'Book 1', genre: 'Fiction', authorId: '1' }
        } as BookQueryData
      }
    });

    const fixture = TestBed.createComponent(BookComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#query-result').textContent).toEqual('Book 1');
  });

  it('should render component with query error', async () => {
    mockLink.addMockedResponse({
      request: new BookQuery({ id: '1' }),
      result: {
        errors: [new GraphQLError('Book does not exist')]
      }
    });

    const fixture = TestBed.createComponent(BookComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#query-error').textContent).toEqual('Book does not exist');
  });

  it('should render component with subscription result', fakeAsync(() => {
    const fixture = TestBed.createComponent(BookComponent);

    mockLink.addMockedResponse({
      request: new BookQuery({ id: '1' }),
      result: {
        data: {
          book: { __typename: 'Book', id: '1', name: 'Book 1', genre: 'Fiction', authorId: '1' }
        } as BookQueryData
      }
    });

    fixture.detectChanges();

    mockSubscriptionLink.simulateResult({
      result: {
        data: {
          newBook: { __typename: 'Book', id: '1', name: 'Book 1.1', genre: 'Fiction', authorId: '1' }
        } as NewBookByAuthorSubscriptionData
      }
    });

    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#subscription-result').textContent).toEqual('Book 1.1');

    mockSubscriptionLink.simulateResult({
      delay: 10,
      result: {
        data: {
          newBook: { __typename: 'Book', id: '2', name: 'Book 2', genre: 'Fiction', authorId: '1' }
        } as NewBookByAuthorSubscriptionData
      }
    }, true);
    tick(10);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#subscription-result').textContent).toEqual('Book 2');
  }));
});
