/**
 * Serializes async operations so storage commands never interleave
 * (single shared scratch index, single active-checkpoint pointer).
 */
export class Mutex {
  private tail: Promise<void> = Promise.resolve();

  run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation, operation);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
