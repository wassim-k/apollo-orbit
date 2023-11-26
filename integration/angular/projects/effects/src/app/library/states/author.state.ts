import { Injectable, Injector } from '@angular/core';
import { Apollo, ApolloCache, InMemoryCache, MutationUpdate, OnInitState, State, identifyFragment } from '@apollo-orbit/angular';
import { FetchResult } from '@apollo/client/core';
import { AddBookMutation, AddBookMutationInfo, AuthorFragmentDoc, AuthorsQuery, NewAuthorSubscription, NewAuthorSubscriptionData } from '../../graphql';
import { Toastify } from '../../services/toastify.service';

@Injectable()
@State()
export class AuthorState implements OnInitState {
  public constructor(
    private readonly injector: Injector,
    private readonly cache: InMemoryCache,
    private readonly toastify: Toastify
  ) { }

  public onInit(): void {
    // onInit method allows us to run logic right after APP_INITIALIZER has completed.
    // If we were not using APP_INITIALIZER then this logic can be moved to the constructor instead.
    this.apollo.subscribe(new NewAuthorSubscription()).subscribe(this.onNewAuthor.bind(this));
  }

  public onNewAuthor(result: FetchResult<NewAuthorSubscriptionData>): void {
    const newAuthorData = result.data;
    if (!newAuthorData) return;
    this.cache.updateQuery(new AuthorsQuery(), data => data ? { authors: [...data.authors, { ...newAuthorData.newAuthor, books: [] }] } : data);
    this.toastify.success(`New author '${newAuthorData.newAuthor.name}' was added.`);
  }

  @MutationUpdate(AddBookMutation)
  public addBook(cache: ApolloCache<any>, info: AddBookMutationInfo): void {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    const authorId = info.variables?.book.authorId as string;

    cache.updateFragment(
      identifyFragment(AuthorFragmentDoc, authorId),
      author => author ? ({ ...author, books: [...author.books, addBook] }) : author
    );
  }

  private get apollo(): Apollo {
    // Lazy inject apollo to avoid race condition with APP_INITIALIZER
    // Otherwise apollo can be injected directly into the constructor.
    return this.injector.get(Apollo);
  }
}
