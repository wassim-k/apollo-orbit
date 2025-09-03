import { fromEvent, OperatorFunction } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export function takeUntilAborted<T>(signal: AbortSignal | null | undefined): OperatorFunction<T, T> {
  return !signal
    ? source => source
    : source => source.pipe(takeUntil(fromEvent(signal, 'abort')));
}
