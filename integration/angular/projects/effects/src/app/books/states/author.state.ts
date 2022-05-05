import { Injectable, Injector } from '@angular/core';
import { Apollo, InMemoryCache, OnInitState, State } from '@apollo-orbit/angular';
import { FetchResult } from '@apollo/client/core';
import { Toastify } from '../../services/toastify.service';
import { AuthorsQuery, NewAuthorSubscription, NewAuthorSubscriptionData } from '../gql/author';

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

  public onNewAuthor({ data }: FetchResult<NewAuthorSubscriptionData>): void {
    if (!data) return;
    this.cache.updateQuery(new AuthorsQuery(), query => query ? { authors: [...query.authors, data.newAuthor] } : query);
    this.toastify.success(`New author '${data.newAuthor.name}' was added.`);
  }

  private get apollo(): Apollo {
    // Lazy inject apollo to avoid race condition with APP_INITIALIZER
    // Otherwise apollo can be injected directly into the constructor.
    return this.injector.get(Apollo);
  }
}
