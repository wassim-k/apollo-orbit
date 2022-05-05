import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpLink, HttpOptions } from '@apollo/client/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpConfig } from './httpConfig';

@Injectable()
export class HttpLinkFactory {
    public constructor(
        private readonly httpClient: HttpClient
    ) { }

    public create(options: HttpOptions = {}): HttpLink {
        return new HttpLink({
            ...options,
            fetch: this.fetch.bind(this)
        });
    }

    public fetch(url: string, config: HttpConfig): Promise<Response> {
        return this.httpClient.request(config.method, url, {
            ...config,
            observe: 'response',
            responseType: 'text',
            reportProgress: false,
            withCredentials: config.credentials === 'include'
        }).pipe(
            map(response => this.getResponse(response)),
            catchError(error => of(this.getErrorResponse(error)))
        ).toPromise() as Promise<Response>;
    }

    protected getErrorResponse(errorResponse: HttpErrorResponse): Response {
        const { error, name, message, ...rest } = errorResponse;
        if (errorResponse.status <= 0) throw new TypeError('Failed to fetch');
        return this.getResponse({ body: error, ...rest } as HttpResponse<string>);
    }

    protected getResponse(response: HttpResponse<string>): Response {
        if (typeof Response !== 'function') {
            // node environment
            const { ok, status, statusText, url, body } = response;
            return { ok, status, statusText, url, text: () => Promise.resolve(body) } as Response;
        } else {
            // browser environment
            return new Response(response.body, { ...response, headers: this.mapHeaders(response.headers) });
        }
    }

    protected mapHeaders(headers: HttpHeaders): HeadersInit {
        return headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {});
    }
}
