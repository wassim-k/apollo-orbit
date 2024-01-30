import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { makeFetch } from '@apollo-orbit/angular/fetch';
import { BatchHttpLink } from '@apollo/client/link/batch-http';

@Injectable()
export class BatchHttpLinkFactory {
    public constructor(
        private readonly httpClient: HttpClient
    ) { }

    public create(options: BatchHttpLink.Options = {}): BatchHttpLink {
        return new BatchHttpLink({
            ...options,
            fetch: makeFetch(this.httpClient)
        });
    }
}
