import type { Cache, MissingFieldError, OperationVariables as Variables } from '@apollo/client';
import { map, Observable } from 'rxjs';
import type { CacheQueryOptions, CacheQueryResult } from './cacheEx';

export class IncompleteCacheError extends Error {
  public constructor(missing?: MissingFieldError) {
    super(`A required cache query read an incomplete result. ${missing?.message ?? 'The cache holds none of the data.'}`);

    this.name = 'IncompleteCacheError';
  }
}

export class CacheQueryObservable<
  TData = unknown,
  TVariables extends Variables = Variables,
  TPartial extends boolean = false,
  TRequired extends boolean = false
> extends Observable<CacheQueryResult<TData, TPartial, TRequired>> {
  private lastResult: CacheQueryResult<TData, TPartial, TRequired> | undefined;
  private readonly required: boolean;

  public constructor(
    private readonly cache: Cache.Implementation,
    private readonly options: CacheQueryOptions<TData, TVariables, TPartial>,
    ...[required]: [TRequired] extends [false] ? [required?: TRequired] : [required: TRequired]
  ) {
    super(subscriber => new Observable<Cache.DiffResult<TData>>(observer =>
      this.cache.watch<TData, TVariables>({
        ...this.diffOptions,
        immediate: this.options.immediate ?? true,
        callback: diff => observer.next(diff)
      })
    ).pipe(map(diff => this.toResult(diff))).subscribe(subscriber));

    this.required = required ?? false;
  }

  public getCurrentResult(): CacheQueryResult<TData, TPartial, TRequired> {
    return this.toResult(this.cache.diff(this.diffOptions));
  }

  private get diffOptions(): Cache.DiffOptions<TData, TVariables> {
    const { optimistic = true, returnPartialData = false } = this.options;
    return { ...this.options, optimistic, returnPartialData };
  }

  private toResult({ result: data, complete, missing }: Cache.DiffResult<TData>): CacheQueryResult<TData, TPartial, TRequired> {
    if (this.required && !complete) throw new IncompleteCacheError(missing);

    const { lastResult } = this;

    if (
      lastResult?.complete === complete &&
      lastResult.data === data &&
      lastResult.missing?.message === missing?.message
    ) {
      return lastResult;
    }

    this.lastResult = { data, complete, missing } as CacheQueryResult<TData, TPartial, TRequired>;
    return this.lastResult;
  }
}
