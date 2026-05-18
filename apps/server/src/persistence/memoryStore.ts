export class MemoryStore<TValue> {
  private readonly items = new Map<string, TValue>();

  get(key: string): TValue | undefined {
    return this.items.get(key);
  }

  set(key: string, value: TValue): TValue {
    this.items.set(key, value);
    return value;
  }

  has(key: string): boolean {
    return this.items.has(key);
  }

  values(): TValue[] {
    return [...this.items.values()];
  }
}
