import { Injector, PendingTasks } from '@angular/core';

export class OperationTasks {
  private readonly releases: Set<() => void> = new Set();
  private readonly pendingTasks: PendingTasks;

  public constructor(injector: Injector) {
    this.pendingTasks = injector.get(PendingTasks);
  }

  public add<T>(promise: Promise<T>): Promise<T> {
    const task = this.pendingTasks.add();

    const release = (): void => {
      this.releases.delete(task);
      task();
    };

    this.releases.add(task);
    promise.then(release, release);

    return promise; // Return original promise not to invalidate rejection prevention
  }

  public releaseAll(): void {
    this.releases.forEach(release => release());
    this.releases.clear();
  }
}
