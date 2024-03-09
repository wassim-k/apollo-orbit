import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpConfig } from './httpConfig';

export { HttpConfig } from './httpConfig';

const normalizedHeaders: { [from: string]: string | undefined } = {
    'accept': 'Accept',
    'content-type': 'Content-Type'
};

export const makeFetch = (httpClient: HttpClient) => (url: string, { method, ...config }: HttpConfig): Promise<Response> => {
    return lastValueFrom(
        httpClient.request(method, url, {
            ...config,
            headers: normalizeHeaders(config.headers),
            observe: 'response',
            responseType: 'text',
            reportProgress: false,
            withCredentials: config.credentials === 'include'
        }).pipe(
            map(response => getResponse(response)),
            catchError(error => of(getErrorResponse(error)))
        )
    );
};

function getErrorResponse(errorResponse: HttpErrorResponse): Response {
    const { error, name, message, ...rest } = errorResponse;
    if (errorResponse.status <= 0) throw new TypeError('Failed to fetch');
    return getResponse({ body: error, ...rest } as HttpResponse<string>);
}

function getResponse(response: HttpResponse<string>): Response {
    if (typeof Response !== 'function') {
        // node environment
        const { ok, status, statusText, url, body } = response;
        return { ok, status, statusText, url, text: () => Promise.resolve(body) } as Response;
    } else {
        // browser environment
        return new Response(response.body, { ...response, headers: mapHeaders(response.headers) });
    }
}

function mapHeaders(headers: HttpHeaders | undefined): HeadersInit | undefined {
    if (!headers) return headers;
    return headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {});
}

// @apollo/client passes headers in a format that fails angular checks
function normalizeHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
    if (!headers) return headers;

    return Object
        .keys(headers)
        .reduce(
            (acc, header) => {
                const normalizedHeader = normalizedHeaders[header];
                return normalizedHeader !== undefined
                    ? { ...acc, [normalizedHeader]: headers[header] }
                    : { ...acc, [header]: headers[header] };
            },
            {});
}
