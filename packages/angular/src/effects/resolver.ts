import { Resolver, TransformResolver } from '@apollo-orbit/core';
import { Observable } from 'rxjs';

export const transformNgResolver: TransformResolver = (resolver: Resolver) => {
  return (...args: Parameters<Resolver>) => {
    const result = resolver(...args);
    return result instanceof Observable
      ? result.toPromise()
      : result;
  };
};
