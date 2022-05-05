import { Observable as ZenObservable } from '@apollo/client/core';
import { Observable } from 'rxjs';

export const fromZenObservable = <T>(source: ZenObservable<T>): Observable<T> => new Observable(source.subscribe.bind(source));
