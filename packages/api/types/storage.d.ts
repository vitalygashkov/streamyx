export type AppStorage = {
  state: Record<string, any>;
  getState: <T = any>(cookiesKey?: string | null) => Promise<T>;
  setState: <T = Record<string, any>>(data?: T) => Promise<void>;
};
