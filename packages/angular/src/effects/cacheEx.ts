import { PureQueryOptions } from '@apollo-orbit/angular/core';
import { ApolloCache, DocumentNode, TypedDocumentNode } from '@apollo/client/core';
import { getFragmentQueryDocument } from '@apollo/client/utilities';
import { wrap } from 'optimism';
import { Observable } from 'rxjs';

export interface ApolloCacheEx<TCacheShape> extends ApolloCache<TCacheShape> {
    watchQuery<TData, TVariables>(options: PureQueryOptions<TData, TVariables>): Observable<TData>;
    watchFragment<TData>(options: { id: string; fragmentDoc: DocumentNode | TypedDocumentNode<TData>; fragmentName?: string }): Observable<TData>;
}

const getFragmentDoc = wrap(getFragmentQueryDocument);

export function extendCache<TCacheShape>(cache: ApolloCache<TCacheShape>): ApolloCacheEx<TCacheShape> {
    return Object.defineProperties(cache, {
        watchQuery: {
            value: watchQuery,
            writable: false,
            configurable: false
        },
        watchFragment: {
            value: watchFragment,
            writable: false,
            configurable: false
        }
    }) as ApolloCacheEx<TCacheShape>;
}

function watchQuery<TData, TVariables>(
    this: ApolloCache<any>,
    options: PureQueryOptions<TData, TVariables>
): Observable<TData> {
    return new Observable<TData>(
        subscriber => this.watch<TData, TVariables>({
            ...options,
            optimistic: true,
            immediate: true,
            callback: callback => subscriber.next(callback.result)
        }));
}

function watchFragment<TData>(
    this: ApolloCache<any>,
    options: { id: string; fragmentDoc: DocumentNode | TypedDocumentNode<TData>; fragmentName?: string }
): Observable<TData> {
    return new Observable<TData>(
        subscriber => this.watch<TData>({
            id: options.id,
            query: getFragmentDoc(options.fragmentDoc, options.fragmentName),
            optimistic: true,
            immediate: true,
            callback: callback => subscriber.next(callback.result)
        }));
}
