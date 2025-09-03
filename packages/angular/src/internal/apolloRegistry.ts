import { inject, Injectable, InjectionToken, Injector, Type } from '@angular/core';
import { Apollo } from '../apollo';

@Injectable()
export class ApolloRegistry {
  private readonly providers: Array<() => Apollo> = [];
  private _instances: Array<Apollo> | undefined;

  public register(token: Type<any> | InjectionToken<Apollo>): void {
    const injector = inject(Injector);
    this.providers.push(() => injector.get(token));
    this._instances = undefined;
  }

  public get instances(): Array<Apollo> {
    return (this._instances ??= this.providers.map(provider => provider()));
  }
}
