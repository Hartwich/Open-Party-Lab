import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class LocalJsonStore<TValue> {
  constructor(private readonly filePath: string) {}

  async load(fallbackValue: TValue): Promise<TValue> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as TValue;
    } catch {
      return fallbackValue;
    }
  }

  async save(value: TValue): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(value, null, 2), "utf-8");
  }
}
