import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { makeFetch } from '@apollo-orbit/angular/fetch';
import { HttpLink, HttpOptions } from '@apollo/client/link/http';

@Injectable()
export class HttpLinkFactory {
  public constructor(
    private readonly httpClient: HttpClient
  ) { }

  public create(options: HttpOptions = {}): HttpLink {
    return new HttpLink({
      ...options,
      fetch: makeFetch(this.httpClient) as typeof fetch
    });
  }
}
