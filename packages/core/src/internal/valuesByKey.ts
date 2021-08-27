export class ValuesByKey<T> {
  private readonly store: { [key: string]: ReadonlyArray<T> | undefined } = {};

  public constructor(
    private readonly keySelector: (value: T) => string
  ) { }

  public get(key: string): ReadonlyArray<T> | undefined {
    return this.store[key];
  }

  public add(...values: Array<T>): void {
    values.forEach(value => {
      const key = this.keySelector(value);
      const { [key]: add = [] } = this.store;
      this.store[key] = [...add, value];
    });
  }

  public forEach(fn: (value: Array<T>, key: string) => void): void {
    Object.keys(this.store).map(key => fn(this.store[key] as Array<T>, key));
  }
}
