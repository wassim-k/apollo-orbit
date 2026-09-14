import { Component, inject, Injector, input, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { gql, TypedDocumentNode } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { provideApolloMock } from '../helpers/apollo-mock.provider';

interface Value {
  value: string;
}

interface Book {
  id: string;
  name: string;
}

describe('SignalFragment', () => {
  let apollo: Apollo;
  let mockLink: MockLink;
  let mockSubscriptionLink: MockSubscriptionLink;
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApolloMock()]
    });

    apollo = TestBed.inject(Apollo);
    mockLink = TestBed.inject(MockLink);
    mockSubscriptionLink = TestBed.inject(MockSubscriptionLink);
    injector = TestBed.inject(Injector);
  });

  it('should throw a failed read rather than report it as an incomplete fragment', () => {
    const fragment = apollo.signal.fragment({ fragment: gql`query NotAFragment { book { id } }`, from: 'Book:1', injector });

    expect(() => fragment.result()).toThrow(/Found a query operation named 'NotAFragment'/);
  });

  it('should use fragmentName to identify an id-only reference', () => {
    const fragment = gql`
      fragment AuthorFields on Author { id name }
      fragment BookFields on Book { id name }
    `;
    apollo.cache.writeFragment({
      fragment,
      fragmentName: 'BookFields',
      id: 'Book:1',
      data: { __typename: 'Book', id: '1', name: 'A book' }
    });

    const book = apollo.signal.fragment({ fragment, fragmentName: 'BookFields', from: { id: '1' }, injector });

    expect(book.result()).toMatchObject({ complete: true, data: { name: 'A book' } });
  });

  it('should read the cache synchronously on the first read', fakeAsync(() => {
    const bookFragment = gql`
      fragment SyncBookFragment on Book {
        id
        name
      }
    `;

    apollo.cache.writeFragment({
      id: 'Book:1',
      fragment: bookFragment,
      data: { __typename: 'Book', id: '1', name: 'Book 1' }
    });

    const fragment = apollo.signal.fragment<Book>({
      fragment: bookFragment,
      from: 'Book:1',
      injector
    });

    const result = fragment.result();
    expect(result.complete).toBe(true);
    if (result.complete) expect(result.data.name).toBe('Book 1');

    tick();
  }));

  it('should read the new entity synchronously when `from` changes', fakeAsync(() => {
    const bookFragment = gql`
      fragment SwitchedBookFragment on Book {
        id
        name
      }
    `;

    for (const id of ['1', '2']) {
      apollo.cache.writeFragment({
        id: `Book:${id}`,
        fragment: bookFragment,
        data: { __typename: 'Book', id, name: `Book ${id}` }
      });
    }

    const id = signal('1');
    const fragment = apollo.signal.fragment<Book>({
      fragment: bookFragment,
      from: () => `Book:${id()}`,
      injector
    });

    tick();
    expect(fragment.data()).toEqual({ __typename: 'Book', id: '1', name: 'Book 1' });

    id.set('2');

    // Reading the cache is synchronous, so the new book is available before the effect resubscribes.
    // The previous book's data is never reported against the new `from`.
    expect(fragment.data()).toEqual({ __typename: 'Book', id: '2', name: 'Book 2' });
    expect(fragment.complete()).toBe(true);

    tick();

    expect(fragment.data()).toEqual({ __typename: 'Book', id: '2', name: 'Book 2' });
  }));

  it('should not read `from` until the fragment result is read', fakeAsync(() => {
    const bookFragment = gql`
      fragment RequiredInputBookFragment on Book {
        id
        name
      }
    `;

    apollo.cache.writeFragment({
      id: 'Book:1',
      fragment: bookFragment,
      data: { __typename: 'Book', id: '1', name: 'Book 1' }
    });

    @Component({ template: '{{ fragment.data().name }}' })
    class BookComponent {
      public readonly bookId = input.required<string>();

      // A required input has no value while fields initialise, so `from` must not be read here.
      protected readonly fragment = inject(Apollo).signal.fragment<Book>({
        fragment: bookFragment,
        from: () => ({ __typename: 'Book', id: this.bookId() })
      });
    }

    const fixture = TestBed.createComponent(BookComponent);
    fixture.componentRef.setInput('bookId', '1');
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Book 1');
  }));

  it('should watch fragment data and update when cache changes', fakeAsync(() => {
    const bookFragment = gql`
      fragment WatchBookFragment on Book {
        id
        name
      }
    `;

    // Write a Book object to the cache
    apollo.cache.writeFragment({
      id: 'Book:1',
      fragment: bookFragment,
      data: {
        __typename: 'Book',
        id: '1',
        name: 'Book 1'
      }
    });

    // Create signal fragment
    const fragment = apollo.signal.fragment<Book>({
      fragment: bookFragment,
      from: 'Book:1',
      injector
    });

    tick();

    expect(fragment.data()).toEqual({
      __typename: 'Book',
      id: '1',
      name: 'Book 1'
    });
    expect(fragment.complete()).toBe(true);

    // Update the fragment data in cache
    apollo.cache.writeFragment({
      id: 'Book:1',
      fragment: bookFragment,
      data: {
        __typename: 'Book',
        id: '1',
        name: 'Updated Book'
      }
    });

    tick();

    expect(fragment.data()).toEqual({
      __typename: 'Book',
      id: '1',
      name: 'Updated Book'
    });
  }));

  it('should watch a fragment from many objects', fakeAsync(() => {
    const bookFragment = gql`
      fragment WatchBooksFragment on Book {
        id
        name
      }
    `;

    for (const id of ['1', '2']) {
      apollo.cache.writeFragment({
        id: `Book:${id}`,
        fragment: bookFragment,
        data: { __typename: 'Book', id, name: `Book ${id}` }
      });
    }

    const fragment = apollo.signal.fragment<Book>({
      fragment: bookFragment,
      from: [{ __typename: 'Book', id: '1' }, { __typename: 'Book', id: '2' }],
      injector
    });

    // Read synchronously from the cache, as an array rather than an object
    expect(fragment.data()).toEqual([
      { __typename: 'Book', id: '1', name: 'Book 1' },
      { __typename: 'Book', id: '2', name: 'Book 2' }
    ]);
    expect(fragment.complete()).toBe(true);

    tick();

    apollo.cache.writeFragment({
      id: 'Book:2',
      fragment: bookFragment,
      data: { __typename: 'Book', id: '2', name: 'Updated Book 2' }
    });

    tick();

    expect(fragment.data()).toEqual([
      { __typename: 'Book', id: '1', name: 'Book 1' },
      { __typename: 'Book', id: '2', name: 'Updated Book 2' }
    ]);
  }));

  it('should create fragments with different reference IDs', fakeAsync(() => {
    const bookFragment = gql`
      fragment MultiRefBookFragment on Book {
        id
        name
      }
    `;

    apollo.cache.writeFragment({
      id: 'Book:1',
      fragment: bookFragment,
      data: {
        __typename: 'Book',
        id: '1',
        name: 'Book 1'
      }
    });

    apollo.cache.writeFragment({
      id: 'Book:2',
      fragment: bookFragment,
      data: {
        __typename: 'Book',
        id: '2',
        name: 'Book 2'
      }
    });

    const fragment = apollo.signal.fragment<Book>({
      fragment: bookFragment,
      from: () => 'Book:1',
      injector
    });

    tick();
    expect(fragment.data().name).toBe('Book 1');
    expect(fragment.complete()).toBe(true);
    expect(fragment.missing()).toBeUndefined();

    const newFragment = apollo.signal.fragment<Book>({
      fragment: bookFragment,
      from: 'Book:2',
      injector
    });

    tick();

    expect(newFragment.data().name).toBe('Book 2');
  }));

  it('should expose the variables it reads the cache with', () => {
    const id = signal('1');

    const signalFragment = apollo.signal.fragment({
      fragment: gql`fragment BookName on Book { name }`,
      from: 'Book:1',
      variables: () => ({ id: id() }),
      injector
    });

    expect(signalFragment.variables()).toEqual({ id: '1' });

    id.set('2');

    expect(signalFragment.variables()).toEqual({ id: '2' });
  });

  it('should reject a stale write from a previous owner before effect cleanup', fakeAsync(() => {
    const bookFragment: TypedDocumentNode<{ __typename: 'Book'; id: string; name: string }> = gql`fragment Book on Book { id name }`;
    const from = signal('Book:1');
    const write = (id: string, name: string): void => {
      apollo.cache.writeFragment({ id: `Book:${id}`, fragment: bookFragment, data: { __typename: 'Book', id, name } });
    };

    write('1', 'one');
    write('2', 'two');

    const signalFragment = apollo.signal.fragment({ fragment: bookFragment, from, injector });

    tick();

    expect(signalFragment.data().name).toBe('one');

    from.set('Book:2');

    expect(signalFragment.data().name).toBe('two');

    write('1', 'old updated');

    expect(signalFragment.data().name).toBe('two');

    tick();

    expect(signalFragment.data().name).toBe('two');
  }));
});
