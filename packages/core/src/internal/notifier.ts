export class Notifier {
  private listeners: Array<() => void> = [];
  private timeoutId: NodeJS.Timeout | undefined = undefined;

  public defer<T>(value: T): Promise<T> {
    return new Promise(resolve => this.schedule(() => resolve(value)));
  }

  public schedule(listener: () => void): void {
    this.listeners.push(listener);
    this.timeoutId ??= setTimeout(() => this.notify(), 0);
  }

  private notify(): void {
    const { listeners } = this;
    this.timeoutId = undefined;
    this.listeners = [];
    for (const listener of listeners) {
      listener();
    }
  }
}
