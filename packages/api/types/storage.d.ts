export type AppStorage<T = Record<string, any>> = {
  load(): Promise<void>;
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  save(items?: T): Promise<void>;
  append(items: T): Promise<void>;
  items(): T;
} & T;
